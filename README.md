# AWS CloudFormation - Continuous Integration (CI) for Python Appium with AWS Device Farm

This project is implemented purposely for Python Appium Mobile Testing with AWS Device Farm. This CI is designed for AWS Code Development Tools with lambda functions calling AWS Device Farm.

## Getting Started

This project consists of 3 folders.

1. **cloudFormation** AWS CloudFormation code to deploy all resources needed for this CI

2. **lambdaScripts** AWS Lambda functions zip files for creating and getting a test run on AWS Device Farm

3. **testScripts** Python Appium test scripts for mobile testing which is run on AWS Device Farm

### Prerequisites

**For AWS solution architect**:

-   Understand CloudFormation
-   Require Full access for many resources (see a list of AWS resources in this project [here](cloudFormation/README.md))

**For Python Appium developer**:

-   Understand Python project and its dependencies [AWS document](https://docs.aws.amazon.com/devicefarm/latest/developerguide/test-types-android-appium-python.html)
-   Understand Appium client [Appium document](http://appium.io/docs/en/about-appium/appium-clients/)
-   Understand Git [Simple Git](https://rogerdudler.github.io/git-guide/)

**For NodeJS developer (for AWS Lambda functions)**:

-   Understand NodeJS streaming
-   Understand AWS Device Farm SDK

### Setup

#### For AWS solution architect:

1. Create new S3 bucket for uploading AWS lambda zip files (Recommend to have a folder)

2. Create new CloudFormation stack and upload `codePipeline_lambda_deviceFarm.yml` file

3. Fill in parameters

    - AWSDeviceFarmProjectArn _AWS Device Farm project's arn_

    - AWSDeviceFarmDevDevicePoolArn _AWS Device pool's arn for small testing set_

    - AWSDeviceFarmProdDevicePoolArn _AWS Device pool's arn for large testing set_

    - AWSS3BucketName _AWS S3 bucket name which stores zipped lambda files_

    - AWSS3KeyName _AWS S3 key name (folder name) `must end with /` which stores zipped lambda files_

    - AWSStepFunctionsIteratorCount _A number of iteration for step functions_

4. Click `create` and done

#### For Python Appium developer:

1. `git commit` and `git push` to CodeCommit repository (which is created from CloudFormation)

2. Develop test scripts under `tests` folder

3. Once finish, git push to remote repo

4. Browse to CodePipeline `lambda_device_farm_pipeline` and click `Release changes`

5. Wait to see the result from AWS Device Farm

## Running the tests

The test will be automatically generated and push to AWS Device Farm right after `git push` to the remote repo (CodeCommit)

## AWS Resources in this Project

Please read [CloudFormation README](cloudFormation/README.md) for more details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Authors

-   **Nattavit Kamoltham** - _Solutions & Integration Architect @ FWD Innovation Center_ - [email him](kamoltham.n.t@gmail.com)

## License

This project is licensed under the MIT License, AWS - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

-   Hat tip to anyone whose code was used
-   Inspiration
-   etc
