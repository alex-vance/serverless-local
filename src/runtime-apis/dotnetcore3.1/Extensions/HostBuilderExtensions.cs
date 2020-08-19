using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using dotnetcore31;
using McMaster.NETCore.Plugins;
using Newtonsoft.Json;
using Microsoft.Extensions.DependencyInjection;
using Amazon.Lambda.Core;
using System.Reflection;

namespace Microsoft.Extensions.Hosting
{
    public static class HostBuilderExtensions
    {
        public static IHostBuilder ConfigureLambdas(this IHostBuilder hostBuilder, string handler)
        {
            var hi = JsonConvert.DeserializeObject<HandlerInfo>(handler);

            hi.ExtractedDirectory = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());

            Directory.CreateDirectory(hi.ExtractedDirectory);
            ZipFile.ExtractToDirectory(hi.Artifact, hi.ExtractedDirectory);

            var handlerParts = hi.Handler.Split("::");

            PluginLoader handlerLoader;

            var filenameWithoutExtension = handlerParts[0];
            var fullDllPath = Path.Combine(hi.ExtractedDirectory, $"{filenameWithoutExtension}.dll");
            handlerLoader = PluginLoader.CreateFromAssemblyFile(fullDllPath, configure =>
            {
                configure.PreferSharedTypes = true;
            });

            hi.Loader = handlerLoader;

            using (handlerLoader.EnterContextualReflection())
            {
                var handlerAsm = handlerLoader.LoadDefaultAssembly();

                hi.Type = handlerAsm.GetType(handlerParts[1], true, true);
                hi.Method = hi.Type.GetMethod(handlerParts[2]);
                hi.Parameters = hi.Method.GetParameters();
                hi.Instance = Activator.CreateInstance(hi.Type);
            }

            hostBuilder.ConfigureServices(serviceCollection =>
            {
                serviceCollection.AddSingleton<HandlerInfo>(hi);
            });

            return hostBuilder;
        }
    }
}