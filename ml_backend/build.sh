#!/usr/bin/env bash
# exit on error
set -o errexit

# Update packages and install missing OpenCV binary dependencies
apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0

# Install python dependencies
pip install --upgrade pip
pip install -r requirements.txt