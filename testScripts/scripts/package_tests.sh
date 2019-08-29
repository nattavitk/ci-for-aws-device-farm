#!/bin/bash

# read -rsp $'\nMake sure desired capabilities is empty.\n\tVerify your tests were collected, press any key to continue or CTRL+C to abort.\n' -n1 key

## Zip tests/, wheelhouse/, and requirements.txt into test_bundle.zip
zip -r test_bundle.zip tests/ wheelhouse/ requirements.txt
