# AWS Lambda script to create a run on AWS Device Farm

This script works with AWS CodePipeline (Test) which calls AWS Device Farm SDK to

1. Create upload for a test package
2. Get upload to check if the uploading from no.1 is successfully done
3. Schedule run to run the test

## Getting Started

This project is implemented by Lambda NodeJS 10.x runtime and JavaScript ES6

### Prerequisites

Before developing please read some documents for

-   AWS SAM for serverless implementation
-   NodeJS streaming
-   AWS Device Farm SDK

## Running the tests

TBD

## Deployment

```
sam package \
    --output-template-file packaged.yaml \
    --s3-bucket <your_S3_bucket_for_SAM_package>
```

## Authors

-   **Nattavit Kamoltham** - _Solutions & Integration Architect @ FWD Innovation Center_

## License

This project is licensed under the MIT License
