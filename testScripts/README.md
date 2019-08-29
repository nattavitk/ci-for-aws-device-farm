# Python Appium Test Script Project

This project is for Python Appium mobile app testing. It runs on Appium test framework and AWS Device Farm.

## Getting Started

**Note: all test scripts is under `tests` folder.**

**The other files and folders in root path must stay the same for CI.**

    This project only supports Python.

### File structure (testScripts folder)

    .
    ├── scripts                 # Scripts for Python build in CI
    ├── tests                   # Test scripts (Python Appium) for AWS Device Farm
    │   ├── travel              # Test script for Travel
    │   └── ...                 # etc.
    ├── .gitignore              # Ignore some files to commit
    ├── buildspec.yml           # Build spec file for CodePipeline
    ├── README.md
    └── testSpec.yml            # Test specification for AWS Device Farm

### Prerequisites

1. Install `git`

2. Configure `Python` and `pytest` version @ [buildspec.yml line 9 & 17](buildspec.yml)

3. Configure `Appium-Python-Client` version @ [buildspec.yml line 18](buildspec.yml)

4. Configure `Appium Server` version @ [testSpec.yaml line 12](testSpec.yml)

5. Add git remote repository

    ```
    git remote add origin <https:// or ssh:// path of CodeCommit Repository>
    ```

### Start

1. Update test script under `tests` folder

2. Git commit and push `testScripts` project (only this folder) to CodeCommit Repository

    2.1 Git add all updated file (stage files)

    ```
    git add .
    ```

    2.2 Git commit the staged files

    ```
    git commit -m "<your message to describe this commit>"
    ```

    2.3 Git push all committed code to remote repository Master branch

    ```
    git push origin master
    ```

3. Once CI pipeline get triggered by the code updating, please check the pipeline status and AWS Device Farm test run

## Authors

-   **Nattavit Kamoltham** - _Solutions & Integration Architect @ FWD Innovation Center_ - [email him](nattavit.kamoltham@fwd.com)
