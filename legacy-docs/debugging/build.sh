#!/bin/bash

export CGO_ENABLED=0
for dir in legacy-docs/debugging/*/; do
	bin=$(basename ${dir})
	go build -C ${dir} -o ${PWD}/${bin}
done
