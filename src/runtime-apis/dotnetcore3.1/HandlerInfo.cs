using System;
using System.Reflection;

namespace dotnetcore31
{
    public class HandlerInfo
    {
        public string Handler { get; set; }
        public string Artifact { get; set; }
        public string ExtractedDirectory { get; set; }
        public Type Type { get; set; }
        public object Instance { get; set; }
        public MethodInfo Method { get; set; }
        public ParameterInfo[] Parameters { get; set; }
    }
}