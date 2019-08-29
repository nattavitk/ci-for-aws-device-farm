#!/bin/bash

# Run test collecting
# py.test --collect-only tests/

## Remove cached files
find . -name '__pycache__' -type d -exec rm -r {} +
find . -name '*.pyc' -exec rm -f {} +
find . -name '*.pyo' -exec rm -f {} +
find . -name '*~' -exec rm -f {} +

## Write installed packages to requirements.txt
pip freeze > requirements.txt

## Build wheel archive
pip wheel --wheel-dir wheelhouse -r requirements.txt