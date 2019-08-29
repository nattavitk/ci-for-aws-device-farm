const AWS = require("aws-sdk");

// Setup AWS instance for each services
const codePipeline = new AWS.CodePipeline();
const deviceFarm = new AWS.DeviceFarm({
    apiVersion: "2015-06-23",
    region: "us-west-2" // AWS Device Farm is only in us-west-2 (Oregon)
});

exports.handler = async (event, context) => {
    // Step Function Variables
    let isTaskPassed = false; // Set when get the result from AWS Device Farm
    let index = event.iterator.index;
    const step = event.iterator.step;
    const count = event.iterator.count;
    let isContinue = true;
    
    // Calculate the step iteration
    index += step;
    isContinue = index < count;
    
    // CodePipeline jobId
    const jobId = event.codePipeline.jobId;
    
    // Device Farm Run's Arn
    const runArn = event.deviceFarm.runArn; 
    
    /**
     * putJobSuccess - Notify AWS CodePipeline of a successful job
     * @param {String} message
     */
    const putJobSuccess = async message => {
        console.log("putJobSuccess", message);
        const params = { jobId };

        try {
            await codePipeline.putJobSuccessResult(params).promise();
            context.succeed(message);
        } catch (error) {
            context.fail(error);
        }
    };

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
     * getRun
     */
    const getRun = async () => {
        console.log("getRun");
        const param = {
            arn: runArn
        };

        try {
            const data = await deviceFarm.getRun(param).promise();

            const runResult = data && data.run && data.run.result;
            
            console.log(runResult);
            
            if (runResult && runResult === "PASSED") {
                // Finish this lambda function successfully
                await putJobSuccess(data);
                isTaskPassed = true;
            } else {
                if (runResult && runResult === "PENDING") {
                    // Loop the iteration in AWS Step functions
                    // Do nothing
                    if (!isContinue) {
                        await putJobFailure("Exceeds attempts. Please manual check on AWS Device Farm instead.");
                        isTaskPassed = true;
                    }
                } else {
                    await putJobFailure("Run Failed");
                    isTaskPassed = true;
                }
            }

        } catch (error) {
            await putJobFailure(error);
            isTaskPassed = true;
        }
    };
    
    // Check AWS Device Farm get-run
    await getRun();
    
    return {
        index,
        count,
        step,
        continue: !isTaskPassed
    }
};
