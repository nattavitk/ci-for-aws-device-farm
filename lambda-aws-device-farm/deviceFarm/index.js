const AWS = require("aws-sdk");
const fs = require("fs");
const AdmZip = require("adm-zip");
const request = require("request");

// Setup AWS instance for each services
const codePipeline = new AWS.CodePipeline();
const deviceFarm = new AWS.DeviceFarm({
    apiVersion: "2015-06-23",
    region: "us-west-2" // AWS Device Farm is only in us-west-2 (Oregon)
});
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const stepFunctions = new AWS.StepFunctions({ apiVersion: "2016-11-23" });

exports.handler = async (event, context) => {
    // Retrieve the Job ID from the Lambda action
    const jobId = event["CodePipeline.job"].id;

    // Get environment variables
    const projectArn = process.env.DEVICE_FARM_PROJECT_ARN;
    const devicePoolArn = process.env.DEVICE_POOL_ARN;
    const testPackageFileName = process.env.TEST_PACKAGE_FILE_NAME;
    const testPackageCreateUploadType =
        process.env.TEST_PACKAGE_CREATE_UPLOAD_TYPE;
    const testSpecFileName = process.env.TEST_SPEC_FILE_NAME;
    const testSpecCreateUploadType = process.env.TEST_SPEC_CREATE_UPLOAD_TYPE;
    const testType = process.env.TEST_TYPE;
    const stateMachineArn = process.env.STEP_FUNCTIONS_STATE_MACHINE_ARN;
    const stepFunctionsIteratorCount =
        Number(process.env.STEP_FUNCTIONS_ITERATOR_COUNT) || 3;
    const stepFunctionsIteratorStep =
        Number(process.env.STEP_FUNCTIONS_ITERATOR_STEP) || 1;
    const stepFunctionsIteratorIndex =
        Number(process.env.STEP_FUNCTIONS_ITERATOR_INDEX) || 0;
    let testPackageArn; // Get it from create-upload
    let testSpecArn; // Get it from create-upload
    let runArn; // Get it from schedule-run

    // Retrieve the value from the Lambda action configuration in AWS CodePipeline.
    const inputArtifactLocation =
        event["CodePipeline.job"].data.inputArtifacts[0].location.s3Location;

    // Necessary file for AWS Device Farm
    const targetDir = "/tmp";
    let getArtifact = false;

    /**
     * putJobSuccess - Notify AWS CodePipeline of a successful job
     * @param {String} message
     */
    // const putJobSuccess = async message => {
    //     console.log("putJobSuccess", message);
    //     const param = { jobId };

    //     try {
    //         await codePipeline.putJobSuccessResult(param).promise();
    //         context.succeed(message);
    //     } catch (error) {
    //         context.fail(error);
    //     }
    // };

    /**
     * putJobFailure - Notify AWS CodePipeline of a failed job
     * @param {String} message
     */
    const putJobFailure = async message => {
        console.log("putJobFailure", message);
        const params = {
            jobId,
            failureDetails: {
                message: JSON.stringify(message),
                type: "JobFailed",
                externalExecutionId: context.invokeid
            }
        };

        try {
            await codePipeline.putJobFailureResult(params).promise();
            context.fail(message);
        } catch (error) {
            context.fail(error);
        }
    };

    /**
     * triggerStepFunctionsGetRunDeviceFarm - Trigger Step Functions
     * @param {String} jobId
     * @param {String} runArn
     */
    const triggerStepFunctionsGetRunDeviceFarm = async (jobId, runArn) => {
        const params = {
            stateMachineArn,
            input: JSON.stringify({
                Comment:
                    "Start Step Functions from Lambda AWSDeviceFarmCreateNewRunWebApp",
                codePipeline: {
                    jobId
                },
                deviceFarm: {
                    runArn
                },
                iterator: {
                    count: stepFunctionsIteratorCount,
                    index: stepFunctionsIteratorIndex,
                    step: stepFunctionsIteratorStep
                }
            }),
            name: `getRunDeviceFarm--${jobId}`
        };

        try {
            const data = await stepFunctions.startExecution(params).promise();
        } catch (error) {
            await putJobFailure(error);
        }
    };

    /**
     * createUpload
     */
    const createUpload = async (fileName, createUploadType) => {
        console.log("createUpload");
        const params = {
            name: fileName,
            projectArn,
            type: createUploadType
        };

        try {
            // AWS Device Farm createUpload
            const data = await deviceFarm.createUpload(params).promise();

            // Get response data from create-upload
            const signedUrl = data && data.upload && data.upload.url;
            if (createUploadType === "APPIUM_WEB_PYTHON_TEST_PACKAGE") {
                testPackageArn = data && data.upload && data.upload.arn;
            } else if (createUploadType === "APPIUM_WEB_PYTHON_TEST_SPEC") {
                testSpecArn = data && data.upload && data.upload.arn;
            }

            // Artifact
            if (!getArtifact) {
                // if file does not exist, download and unzip from S3
                console.log("Get artifact");
                // Get the artifact from S3
                const inputArtifact = await s3
                    .getObject({
                        Bucket: inputArtifactLocation.bucketName,
                        Key: inputArtifactLocation.objectKey
                    })
                    .promise();

                // Unzip artifact and save in `/tmp` folder
                const zip = new AdmZip(inputArtifact.Body);
                zip.extractEntryTo(testPackageFileName, targetDir, false, true);
                zip.extractEntryTo(testSpecFileName, targetDir, false, true);
                getArtifact = true;
            }

            // Stream upload the buffered test_bundle.zip to AWS Device Farm
            const asyncUpload = async () => {
                var stats = fs.statSync(`${targetDir}/${fileName}`);
                const readStream = fs.createReadStream(
                    `${targetDir}/${fileName}`
                );
                readStream.pipe(
                    request(
                        {
                            method: "PUT",
                            url: signedUrl,
                            headers: {
                                "Content-Length": stats["size"],
                                "content-type": "application/octet-stream"
                            }
                        },
                        (err, res, body) => {
                            if (err) console.error(error);
                            // console.log(body);
                        }
                    )
                );

                // Make streaming asynchronous
                const promiseUpload = new Promise((resolve, reject) => {
                    readStream.on("end", () => resolve());
                    readStream.on("error", reject); // or something like that. might need to close `hash`
                });

                await promiseUpload;
            };

            await asyncUpload();
        } catch (error) {
            await putJobFailure(error);
        }
    };

    /**
     * Synchronous Delay Function
     * @param {Number} ms
     */
    const wait = async ms => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(ms);
            }, ms);
        });
    };

    /**
     * getUpload
     */
    const getUpload = async arn => {
        console.log("getUpload");

        // Delay to wait for uploading to be completed
        await wait(2000);

        let count = 5;
        const param = { arn };

        try {
            // AWS Device Farm getUpload
            const data = await deviceFarm.getUpload(param).promise();

            // If uploading has not done yet, it is needed to recursively check again
            if (data && data.upload && data.upload.status !== "SUCCEEDED") {
                if (count > 0) {
                    console.log("Upload has not done yet");
                    count--;
                    await getUpload(arn);
                } else {
                    await putJobFailure("Exceed attempts to check getUpload");
                }
            }
        } catch (error) {
            await putJobFailure(error);
        }
    };

    /**
     * scheduleRun
     */
    const scheduleRun = async () => {
        console.log("scheduleRun");

        const params = {
            name: `Run from CodePipeline: ${jobId}`,
            devicePoolArn,
            projectArn,
            test: {
                type: testType,
                testPackageArn,
                testSpecArn
            }
        };
        try {
            // AWS Device Farm scheduleRun
            const data = await deviceFarm.scheduleRun(params).promise();
            runArn = data && data.run && data.run.arn;

            console.log(runArn);

            // Finish this lambda function successfully
            // await putJobSuccess(data);
        } catch (error) {
            await putJobFailure(error);
        }
    };

    /**
     * Main Function
     */
    const main = async () => {
        // 1) Test package
        // / Upload test package to AWS Device Farm
        await createUpload(testPackageFileName, testPackageCreateUploadType);
        // / Check if uploading is successful
        await getUpload(testPackageArn);

        // 2) Test spec
        // / Upload test package to AWS Device Farm
        await createUpload(testSpecFileName, testSpecCreateUploadType);
        // / Check if uploading is successful
        await getUpload(testSpecArn);

        // 3) Schedule the run on AWS Device Farm
        await scheduleRun();

        // 4) Trigger Step Funtions for Get Run on AWS Device Farm
        await triggerStepFunctionsGetRunDeviceFarm(jobId, runArn);
    };

    await main();
};
