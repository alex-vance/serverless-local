using System;
using System.Collections.Generic;
using Amazon.Lambda.Core;

namespace dotnetcore31
{
    public class FakeLambdaContext : ILambdaContext
    {
        private readonly string _name;
        private readonly string _version;
        private readonly DateTime _created;
        private readonly int _timeout;

        public FakeLambdaContext(string name = "Fake", string version = "LATEST", int timeout = 6)
        {
            this._name = name;
            this._version = version;
            this._timeout = timeout;
            this._created = DateTime.UtcNow;
        }

        public string AwsRequestId => "1234567890";

        public IClientContext ClientContext => new FakeClientContext();

        public string FunctionName => this._name;

        public string FunctionVersion => this._version;

        public ICognitoIdentity Identity => new FakeCognitoIdentity();

        public string InvokedFunctionArn => $"arn:aws:lambda:serverless:{this._name}";

        public ILambdaLogger Logger => new FakeLambdaLogger();

        public string LogGroupName => $"/aws/lambda/{this._name}";

        public string LogStreamName => $"{DateTime.Now.ToString("yyyy/MM/dd")}/[${this._version}]58419525dade4d17a495dceeeed44708";

        public int MemoryLimitInMB => 1024;

        public TimeSpan RemainingTime => throw new NotImplementedException();
    }

    public class FakeLambdaLogger : ILambdaLogger
    {
        public void Log(string message)
        {
            Console.WriteLine(message);
        }

        public void LogLine(string message)
        {
            Console.WriteLine(message);
        }
    }

    public class FakeClientContext : IClientContext
    {
        public IDictionary<string, string> Environment => throw new NotImplementedException();

        public IClientApplication Client => throw new NotImplementedException();

        public IDictionary<string, string> Custom => throw new NotImplementedException();
    }

    public class FakeCognitoIdentity : ICognitoIdentity
    {
        public string IdentityId => Guid.Empty.ToString();

        public string IdentityPoolId => Guid.Empty.ToString();
    }
}