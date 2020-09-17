# Serverless Local

A serverless framework plugin for running your serverless stack locally.

## Configuration

``` yaml
custom:
  local:
    listeners:
      - event: http
        port: 4001
      - event: sns
        port: 4002
```

## Commands

- sls local start


## Debug

- SLS_DEBUG=* sls local start