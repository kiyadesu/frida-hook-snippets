function hook(soBase) {
    console.log(soBase);
    var soPointer = new NativePointer(soBase);
    var targetAddrPointer = soPointer.add(0x73E50 + 1);     // offset of some instruction, +1 means Thumb
    console.log(targetAddrPointer)

    Interceptor.attach(targetAddrPointer, {
        onEnter: function (args) {
            r1 = args[1];            
            if (!r1.isNull()){
                offset = r1 - soBase - 1
                console.log(offset.toString(16))
            }
        },
        onLeave: function (retval) { }
    });
}

/**
 * hook at the first beginning, the process is spawned by Frida.
 * command: frida -U -f packageName -l xx.js --no-pause
 */
function beforeAPPLaunch(){
    var runtime = Java.use("java.lang.Runtime");
    runtime.doLoad.implementation = function(name, classloader) {
        var ret = this.doLoad(name, classloader);
        if( name.indexOf("libname") != -1){
            console.log("get libname base.");
            var soModule = Process.getModuleByName("libname.so");
            if (soModule == null) {
                console.log("libname not found.");
            } else {
                hook(soModule.base);
            }
        }
        return ret;
    };    
}

/**
 * hook when App is running.
 * command: frida -U packageName -l xx.js
 */
function attachAPP(){
    var soModule = Process.findModuleByName("libname.so");
    if (soModule == null) {
        console.log("libname not found.");
        return;
    }
    hook(soModule.base); 
}

Java.perform(function(){
    // determined by your need.
    beforeAPPLaunch();  
    // attachAPP();
});