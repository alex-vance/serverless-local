using System;
using Microsoft.AspNetCore.Mvc;
using Amazon.Lambda.APIGatewayEvents;
using dotnetcore31;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using System.Reflection;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Newtonsoft.Json.Linq;
using System.Text.Json;

namespace Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class InvokeController : ControllerBase
    {
        private static readonly JsonSerializerSettings _serializerSettings = new JsonSerializerSettings()
        {
            ReferenceLoopHandling = ReferenceLoopHandling.Ignore
        };

        private readonly HandlerInfo _handler;

        public InvokeController(HandlerInfo handler)
        {
            _handler = handler;
        }

        [HttpPost("execute-api")]
        public IActionResult ExecuteApi([FromBody] string request)
        {
            var raw = request.ToString();

            try
            {
                var parameters = new object[_handler.Parameters.Length];

                if (parameters.Length > 0)
                {
                    if (!string.IsNullOrEmpty(raw))
                    {
                        parameters[0] = JsonConvert.DeserializeObject(raw, _handler.Parameters[0].ParameterType);
                    }
                }

                if (_handler.Parameters.Length > 1 && _handler.Parameters[1].ParameterType == typeof(ILambdaContext))
                    parameters[1] = new FakeLambdaContext();

                var result = _handler.Method.Invoke(_handler.Instance, parameters);
                var resultType = result.GetType();

                if (TryGetTaskOfTType(resultType.GetTypeInfo(), out var taskType))
                {
                    // this is a task, so lets get the result from it so we can serialize the offlin payload
                    result = taskType.GetProperty("Result").GetValue(result);
                }
                var json = JsonConvert.SerializeObject(result, Formatting.None, _serializerSettings);

                LocalLogger.Log($"Result: {json}");

                var response = new APIGatewayProxyResponse { StatusCode = 200, Body = json };
                
                return Ok(response);
            }
            catch (Exception e)
            {
                LocalLogger.Error($"Exception occured: {e.ToString()}");

                return Problem(e.Message);
            }
        }

        private static bool TryGetTaskOfTType(TypeInfo taskTypeInfo, out TypeInfo taskOfTTypeInfo)
        {
            while (taskTypeInfo != null)
            {
                if (IsTaskOfT(taskTypeInfo))
                {
                    taskOfTTypeInfo = taskTypeInfo;
                    return true;
                }

                taskTypeInfo = taskTypeInfo.BaseType?.GetTypeInfo();
            }

            taskOfTTypeInfo = null;
            return false;

            bool IsTaskOfT(TypeInfo typeInfo) => typeInfo.IsGenericType && typeInfo.GetGenericTypeDefinition() == typeof(Task<>);
        }

        [HttpPost("sns")]
        public IActionResult Sns()
        {
            return Ok();
        }
    }
}