using System;
using Microsoft.AspNetCore.Mvc;
using Amazon.Lambda.APIGatewayEvents;
using dotnetcore31;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using System.Reflection;
using System.Threading.Tasks;

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

        private readonly IEnumerable<HandlerInfo> _handlers;

        public InvokeController(IEnumerable<HandlerInfo> handlers)
        {
            _handlers = handlers;
        }

        [HttpPost("execute-api")]
        public IActionResult ExecuteApi()
        {
            try
            {
                var handler = _handlers.FirstOrDefault();

                LocalLogger.Log($"Handler - {handler.Handler}");
                LocalLogger.Log($"Type - {handler.Type.Name}");
                LocalLogger.Log($"Method - {handler.Method.Name}");
                LocalLogger.Log($"Paramters - {handler.Parameters.Length}");
                LocalLogger.Log($"Instance - {handler.Instance ?? "null"}");

                var parameters = new object[handler.Parameters.Length];
                var result = handler.Method.Invoke(handler.Instance, parameters);
                var resultType = result.GetType();

                if (TryGetTaskOfTType(resultType.GetTypeInfo(), out var taskType))
                {
                    LocalLogger.Log($"Task Type {taskType}");
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
                LocalLogger.Error($"Exception occured: {e.Message}");
                
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