# Serverless Local

A serverless framework plugin for running your serverless stack locally. IT will run any lambdas utilizing http and sns events as they are defined. This plugin is VERY new and will probably have issues, please report any issues if you do with extensive details!

# Design

I built this plugin due to a problem that I had when utilizing other serverless plugins in an automated/CICD fashion. Basically, for compiled languages (like C# in .NET Core), they suffered from extremely slow execution times. These runtimes typically have a longer startup and thus each subsequent call to the function take a similar cold-start hit. To solve this, each runtime stands up it's own runtime specific api per function in the background and requests to it are routed through a single centralized api. This allows us to make the integration simple (like calling api gateway or sns), but also allow us to stand up background api's that act like warmed up lamdas. In the initial dotnetcore3.1 implementation, there is a noticeable "cold start" and subsequent requests are much faster.

The runtime-apis utiizes the ports starting at 4100 and ending at the nunmber of functions that need to be hosted in the background. Ex: If I have 4 function definitions, the runtime api ports used will be 4100, 4101, 4102, 4103. This will more than likely be changed later for added customization as necessary.

For now, all stdout streams for child processes will be set to inherit so all stdout for your functions will display in the same console as you run serverless-local.

## Supported Runtimes
- dotnetcore 3.1

## Future Runtimes (feel free to open a PR!)
- nodejs12.x
- python3.8

## Configuration

By default, all listeners are added (using the configuration below), but right now only the ports and which event listeners used are configurable.

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

## Debugging

- SLS_DEBUG=* sls local start