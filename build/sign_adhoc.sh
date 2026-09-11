#!/bin/bash
set -e

codesign --force --deep --sign - dist/mac-arm64/taxus.app
