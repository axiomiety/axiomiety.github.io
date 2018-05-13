---
layout: post
title: java-jmx-mbean
excerpt: "A quick introduction to using JMX MBean to control a running application"
categories: [coding]
tags: [java, howto]
comments: false
---

Long story short, I was wondering how to change a run process' loglevel on the fly - that is, without having to restart. This is very useful if the debug info is both large and impacts performance. It turns out you can do this in Java with minimum fuss.

# JMX MBean

JMX is an abbreviation for [Java Management Extensions](https://en.wikipedia.org/wiki/Java_Management_Extensions), which can help manage running processes. Java Beans a classes that satisfy certain properties (primarily a zero-arg constructor, which isn't the same as a default one, and getters/setters) - and MBeans are Management Beans. I'm not sure what the Management part of the name is meant to indiciate given they look like standard Beans to me?

Essentially we'll be starting an MBeans server alongside our application. The server will accept incoming connections and allow us to interact with the running processes by exposing our MBeans. The interface that enables us to do this easily is powered by JMX.

## Pre-requisites

To follow along you'll need a JDK with [JVisaulVM](https://visualvm.github.io). This comes as default in Java 8, but you can download it separately. You can use `jconsole` just as easily.

## Our MBean interface

We start by creating an interface that describes our bean's functionality.

It's nothing fancy - do note the zero-arg constructor though. We don't define a `LogLevel` member variable directly, but this is implicity through the `getLogLevel` and `setLogLevel` getters and setters.


This is what it looks like:

~~~ java
public interface MyControllerMBean {
    public void say(String s, String level);
    public String getLogLevel();
    public void setLogLevel(String level);
    public void exit();
}
~~~

## MBean implementation

Our `MyController` implementation doesn't yield too many surprises. Note I'm using Log4j 2.x, which is why the `Configurator` part probably looks different to what you may be used to.

The `setLogLevel` setter needs to be `synchronized` as multiple people could, in theory, be interacting with the MBean at the same time.

~~~ java
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.core.config.Configurator;

public class MyController implements MyControllerMBean {
    private final Logger logger = LogManager.getLogger(MyController.class);
    private boolean running = false;

    public MyController() {
        running = true;
    }

    public void say(String s, String level) {
        logger.log(Level.getLevel(level), s);
    }

    public boolean isRunning() {
        return running;
    }

    public String getLogLevel() {
        return logger.getLevel().toString();
    }

    public synchronized void setLogLevel(String level) {
        Level logLevel = Level.getLevel(level);
        Configurator.setLevel(LogManager.getLogger(MyController.class).getName(), logLevel);
        logger.log(logger.getLevel(), "LogLevel is now set to " + getLogLevel().toString());
    }

    public void exit() {
        running = false;
    }
}
~~~

## The main process

Our `MainLoader` is pretty boiler-plate. We start by registering our `MyController` MBean with the `MBeanServer`. The one bit that might look out of place is the `ObjectName` class - it's a container that represents the name of an MBean. We then sleep for 5 seconds whilst before checking whether our controller is still running:

~~~ java
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import javax.management.MBeanServer;
import javax.management.ObjectName;
import java.lang.management.ManagementFactory;

public class MainLoader {
    private static final Logger LOGGER = LogManager.getLogger(MainLoader.class);
    private static final int SLEEP_INTERVAL = 5*1000; // 5 seconds

    public static void main(String[] args) throws Exception {
        MBeanServer server = ManagementFactory.getPlatformMBeanServer();
        ObjectName name = new ObjectName("jmxTest:type=MyController");
        MyController controller = new MyController();
        server.registerMBean(controller, name);

        while (controller.isRunning()) {
            LOGGER.info("*yawn* going back to sleep");
            Thread.sleep(SLEEP_INTERVAL);
        }
        LOGGER.info("shutting down...");
    }
}
~~~

## In action

Kicking this off, we see

~~~ shell
[INFO ] 2018-05-12 18:31:34.038 [main] MainLoader - *yawn* going back to sleep
[INFO ] 2018-05-12 18:31:39.046 [main] MainLoader - *yawn* going back to sleep
[INFO ] 2018-05-12 18:31:44.050 [main] MainLoader - *yawn* going back to sleep
~~~

Start up `jvisualvm`. If you don't have your JDK on your path you can naviate to the install's `bin` directory. If you're running everything locally you should see something like that:

![mbean_attached](../../img/jmx_mbean/jvisualvm_mbean_attached.png)

If there's no 'MBeans' tab available you'll need to download the MBean plugin. You can do find it under the 'Tools -> Plugins' menu. Search for 'mbean':

![mbean_plugin](../../img/jmx_mbean/jvisualvm_mbean_plugin.png)

Once installed navigate to the `MBeans` tab. Our package is called `jmxTest` but you'll likely see a few others. For instance log4j exposes some MBeans by default:

![mbean_overview](../../img/jmx_mbean/jvisualvm_mbean_overview.png)


We can use the `say` method invocation on our bean:

![method_invocation](../../img/jmx_mbean/jvisualvm_method_invocation.png)

~~~ shell
[INFO ] 2018-05-12 18:32:19.081 [main] MainLoader - *yawn* going back to sleep
[INFO ] 2018-05-12 18:32:20.196 [RMI TCP Connection(4)-192.168.56.1] MyController - yo
[INFO ] 2018-05-12 18:32:24.082 [main] MainLoader - *yawn* going back to sleep
~~~

Note how our IP address was logged.

Remember our `getLogLevel` and `setLogLevel` getters/setters? They show up under "Attributes":

![mbean_property](../../img/jmx_mbean/jvisualvm_mbean_property.png)

If you double-click on the value you can change it directly:

~~~ shell
[INFO ] 2018-05-12 18:34:59.252 [main] MainLoader - *yawn* going back to sleep
[INFO ] 2018-05-12 18:35:03.271 [RMI TCP Connection(5)-192.168.56.1] MyController - LogLevel is now set to INFO
[INFO ] 2018-05-12 18:35:04.257 [main] MainLoader - *yawn* going back to sleep
~~~

Similarly to `say`, we can invoke `exit` causes `running` to be set to `false` and the process exits at the next loop iteration:

~~~ shell
[INFO ] 2018-05-12 18:35:59.332 [main] MainLoader - *yawn* going back to sleep
[INFO ] 2018-05-12 18:36:04.335 [main] MainLoader - shutting down...
~~~

## References

The project is available [here](https://github.com/axiomiety/crashburn/tree/master/jmxBean).

* [Standard MBeans](https://docs.oracle.com/javase/tutorial/jmx/mbeans/standard.html)
* [log4j2 properties file](https://dzone.com/articles/log4j-2-configuration-using-properties-file)
