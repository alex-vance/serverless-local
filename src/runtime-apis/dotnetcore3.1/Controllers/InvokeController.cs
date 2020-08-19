using System;
using Microsoft.AspNetCore.Mvc;
using dotnetcore31;
using Newtonsoft.Json;
using System.Reflection;
using System.Threading.Tasks;
using Amazon.Lambda.Core;

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
            LocalLogger.Log(request);

            try
            {
                var parameters = new object[_handler.Parameters.Length];

                if (parameters.Length > 0)
                {
                    if (!string.IsNullOrEmpty(request))
                    {
                        parameters[0] = JsonConvert.DeserializeObject(request, _handler.Parameters[0].ParameterType);
                    }
                }

                LocalLogger.Log($"{_handler.Parameters[1].ParameterType.Assembly.CodeBase}");
                LocalLogger.Log($"{typeof(ILambdaContext).Assembly.CodeBase}");

                if (_handler.Parameters.Length > 1)
                {
                    parameters[1] = new FakeLambdaContext() as ILambdaContext;
                }

                var result = _handler.Method.Invoke(_handler.Instance, parameters);
                var resultType = result.GetType();

                if (TryGetTaskOfTType(resultType.GetTypeInfo(), out var taskType))
                {
                    // this is a task, so lets get the result from it so we can serialize the offlin payload
                    result = taskType.GetProperty("Result").GetValue(result);
                }
                var json = JsonConvert.SerializeObject(result, Formatting.None, _serializerSettings);

                return Ok(json);
            }
            catch (Exception e)
            {
                LocalLogger.Error($"Exception occured: {e.ToString()}");
                LocalLogger.Error($"InnerException: {e.InnerException?.ToString()}");
                LocalLogger.Error($"Inner Inner Exception {e.InnerException?.InnerException?.ToString()}");

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