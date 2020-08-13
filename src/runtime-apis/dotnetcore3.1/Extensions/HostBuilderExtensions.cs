using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using dotnetcore31;
using McMaster.NETCore.Plugins;
using Newtonsoft.Json;
using Microsoft.Extensions.DependencyInjection;

namespace Microsoft.Extensions.Hosting
{
    public static class HostBuilderExtensions
    {
        public static IHostBuilder ConfigureLambdas(this IHostBuilder hostBuilder, string[] handlers)
        {
            var loadedAssemblies = new Dictionary<string, PluginLoader>();

            var handlerInfos = handlers.Select(x =>
            {
                var hi = JsonConvert.DeserializeObject<HandlerInfo>(x);

                LocalLogger.Log($"Found handler {hi.Handler} at path {hi.Artifact}");

                hi.ExtractedDirectory = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());

                LocalLogger.Log($"Extracted artifact to ${hi.ExtractedDirectory}");

                Directory.CreateDirectory(hi.ExtractedDirectory);
                ZipFile.ExtractToDirectory(hi.Artifact, hi.ExtractedDirectory);

                var handlerParts = hi.Handler.Split("::");

                PluginLoader handlerLoader;

                if (loadedAssemblies.ContainsKey(hi.Artifact))
                {
                    handlerLoader = loadedAssemblies[hi.Artifact];
                }
                else
                {
                    var filenameWithoutExtension = handlerParts[0];
                    var fullDllPath = Path.Combine(hi.ExtractedDirectory, $"{filenameWithoutExtension}.dll");
                    handlerLoader = PluginLoader.CreateFromAssemblyFile(fullDllPath);
                    loadedAssemblies.Add(hi.Artifact, handlerLoader);
                }

                using (handlerLoader.EnterContextualReflection())
                {
                    var handlerAsm = handlerLoader.LoadDefaultAssembly();

                    hi.Type = handlerAsm.GetType(handlerParts[1], true, true);
                    hi.Method = hi.Type.GetMethod(handlerParts[2]);
                    hi.Parameters = hi.Method.GetParameters();
                    hi.Instance = Activator.CreateInstance(hi.Type);

                    return hi;
                }
            }).ToList();

            hostBuilder.ConfigureServices(serviceCollection =>
            {
                serviceCollection.AddSingleton<IEnumerable<HandlerInfo>>(handlerInfos);
            });

            return hostBuilder;
        }
    }
}