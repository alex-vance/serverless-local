# Serverless Local

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
