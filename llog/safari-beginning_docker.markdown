---
layout: default
title: llog - safari, beginning docker
category: pages
---

    vagrant@vagrant-ubuntu-wily-64:~$ docker run ubuntu ls
    Unable to find image 'ubuntu:latest' locally
    latest: Pulling from ubuntu
    
    dbcb51e048f9: Downloading [===========>                                       ] 15.68 MB/65.69 MB
    4e910c38549a: Download complete
    d43cf1f769e9: Download complete
    a572fb20fc42: Download complete

Q: where are those images bing downloaded from?

It's now been added as part of our inventory, which can list via `docker images`:

    vagrant@vagrant-ubuntu-wily-64:~$ docker images
    REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
    ubuntu              latest              a572fb20fc42        2 days ago          187.9 MB

Check the status via `docker ps -a` - which includes all containers, even those which aren't running.

    vagrant@vagrant-ubuntu-wily-64:~$ docker ps -a
    CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS                     PORTS               NAMES
    b0794f479c74        ubuntu:latest       "ls"                4 minutes ago       Exited (0) 4 minutes ago                       lonely_yonath

We can remove the container via `docker rm <container_id>` - like `docker rm b0794f479c74`. We can automatically remove a container after running a command using `docker run --rm`.

The `-i` flag means it won't close STDIN, and `-t` emulates a text terminal.

Run bash: `docker run --rm -i -t ubuntu bash`.
Random: `/bin/bash -c "apt-get install -y vim && vim`.

Can run in such a way that you don't need to attach. Using the `-d` switch. You can also map ports via `-p`. E.g.: `docker run -d -p 2222:22 ...` (with something quite complex to install and run ssh all in one line!). The detach mode returns the container id, which can then be used via `docker logs <container_id>`.

`docker kill <container_id`, and manually clean it up via `docker rm` (for commands that can't be stopped via `docker stop`).

You can use the friendly name to reference containers instead of their id (which you can set via `--name`).

    vagrant@vagrant-ubuntu-wily-64:~$ docker run -d ubuntu ping google.com
    f5ed91c5fae5c68f213d21c0e5152f65455619a2163c3589108e27d8f4f2f6a9
    vagrant@vagrant-ubuntu-wily-64:~$ docker run -d ubuntu ping google.com
    bb2dc8d217ba63854190f61a72cbb535f0328c704b72366f38f6e8e87f53dfb7
    vagrant@vagrant-ubuntu-wily-64:~$ docker ps
    CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
    bb2dc8d217ba        ubuntu:latest       "ping google.com"   2 seconds ago       Up 2 seconds                            silly_hawking
    f5ed91c5fae5        ubuntu:latest       "ping google.com"   7 seconds ago       Up 7 seconds                            modest_perlman
    vagrant@vagrant-ubuntu-wily-64:~$ docker kill modest_perlman
    modest_perlman
    vagrant@vagrant-ubuntu-wily-64:~$ docker run --name santa -d ubuntu ping google.com
    59e174709435071835ae483d51f7ae464bc05d8bfc4a1a1103203258caa4ca44
    vagrant@vagrant-ubuntu-wily-64:~$ docker ps
    CONTAINER ID        IMAGE               COMMAND             CREATED              STATUS              PORTS               NAMES
    59e174709435        ubuntu:latest       "ping google.com"   5 seconds ago        Up 5 seconds                            santa
    bb2dc8d217ba        ubuntu:latest       "ping google.com"   About a minute ago   Up About a minute                       silly_hawking

`docker inspect` returns a JSON datastructure:

    vagrant@vagrant-ubuntu-wily-64:~$ docker inspect santa
    [{
        "AppArmorProfile": "",
        "Args": [
            "google.com"
        ],
        "Config": {
            "AttachStderr": false,
            "AttachStdin": false,
            "AttachStdout": false,
            "Cmd": [
                "ping",
                "google.com"
            ],
            "CpuShares": 0,
      ...

`docker logs` follows the logs live, like `tail -f`. It also works on terminated processes.

`docker ps -lq` returns the id of the last container. Useful as a shortcut, like `docker logs \`docker ps -lq\``.

`docker stop` is a `SIGTERM` followed by a `SIGKILL`, or you can use `docker kill` for the latter straight away. To clear everything, use `docker ps -aq | xargs docker rm -f`.

We can make some changes to the filesystem and see those via `docker diff`:

    vagrant@vagrant-ubuntu-wily-64:~$ docker run --name bar -i -t ubuntu /bin/bash
    root@0dec9578c735:/# mkdir dir_that_did_not_exist
    root@0dec9578c735:/# exit
    vagrant@vagrant-ubuntu-wily-64:~$ docker diff bar
    C /root
    A /root/.bash_history
    A /dir_that_did_not_exist

Commit the changes to a new image via `docker commit santa myuser/newdir`

There is a free registry via the docker hub (docker.io -> signup). `docker login` with the credentials set up above.

`docker push` only pushes layers it's not aware of.

Use `docker rmi <image_name>` to remove the image, and `docker pull <image_name>` to download it. By default this will use the last command it was run with before the commit.

To look at the public index, go to [https://hub.docker.com/](https://hub.docker.com/) and type your query in the search box. Images are official if they are built automatically from a GitHub repo. For instance, `docker pull redis` will grab the 'official' redis docker image: [https://hub.docker.com/_/redis/](https://hub.docker.com/_/redis/).

    vagrant@vagrant-ubuntu-wily-64:~$ docker run --rm -i -t --entrypoint="bash" --link don-redis:redis redis -c 'redis-cli -h $REDIS_PORT_6379_TCP_ADDR'
    172.17.0.1:6379> set msg 'hello world'
    OK
    172.17.0.1:6379> get msg
    "hello world"

Dockerfile - add `FROM` as the first instruction to specify the base image. A `MAINTAINER` tag is also recommended. `RUN` is just like running a command via the shell. Each `RUN` instruction creates a new layer so it's sometimes better to bundle related instructions on a single line.

    vagrant@vagrant-ubuntu-wily-64:~/crashburn/sshd-example$ docker build -t myusername/sshd-example .
    Sending build context to Docker daemon 2.048 kB
    Sending build context to Docker daemon
    Step 0 : FROM ubuntu
     ---> a572fb20fc42
    Step 1 : MAINTAINER foo <foo@bar.com>
     ---> Running in 55e5cc993c95
     ---> 57d821f7e039
    Removing intermediate container 55e5cc993c95
    Step 2 : RUN apt-get update && apt-get install -y openssh-server
     ---> Running in 9aa37b6c9a86
    Ign http://archive.ubuntu.com trusty InRelease
    ...
    Setting up ssh-import-id (3.21-0ubuntu1) ...
    Processing triggers for libc-bin (2.19-0ubuntu6.7) ...
    Processing triggers for ca-certificates (20160104ubuntu0.14.04.1) ...
    Updating certificates in /etc/ssl/certs... 173 added, 0 removed; done.
    Running hooks in /etc/ca-certificates/update.d....done.
    Processing triggers for ureadahead (0.100.0-16) ...
     ---> 2d5df169f8ea
    Removing intermediate container 9aa37b6c9a86
    Step 3 : RUN mkdir -p /var/run/sshd
     ---> Running in 5ec2bd2e7935
     ---> 5fab8bba8c37
    Removing intermediate container 5ec2bd2e7935
    Successfully built 5fab8bba8c37

The image will then be available to use. You can check `docker images`:

    vagrant@vagrant-ubuntu-wily-64:~/crashburn/sshd-example$ docker images
    REPOSITORY                TAG                 IMAGE ID            CREATED              VIRTUAL SIZE
    myusername/sshd-example   latest              5fab8bba8c37        About a minute ago   251.6 MB
    ubuntu                    latest              a572fb20fc42        9 days ago           187.9 MB
    
The `ADD` command takes 2 args, src & destn. The first one *relative* to the project directory at build time. Source could also be a url, which the builder would download and place accordingly.

Use the `CMD` directive to run something by default.

So far it looks like this:

    FROM ubuntu
    
    MAINTAINER foo <foo@bar.com>
    
    RUN apt-get update && apt-get install -y openssh-server
    
    RUN mkdir -p /var/run/sshd
    ADD sshd_config /etc/ssh/sshd_config
    
    CMD /usr/sbin/sshd -D

Another directive is `ENTRYPOINT` like `ENTRYPOINT /usr/sbin/ssh` - which sort of forces whatever gets added via `docker run` as an argument (appended, really).

By default, the commands are being run as root. User `USER` to change that. `WORKDIR` will change the working directory and `ENV` will set an environment variable.

`EXPOSE 2222` exposes the 2222 port outside the container - which is also shown in `docker ps`:

    vagrant@vagrant-ubuntu-wily-64:~/crashburn/sshd-example$ docker ps
    CONTAINER ID        IMAGE                            COMMAND                CREATED             STATUS              PORTS               NAMES
    bf677438e49d        myusername/sshd-example:latest   "/bin/sh -c '/usr/sb   11 seconds ago      Up 11 seconds       2222/tcp            suspicious_davinci

When building on top of another container, the latest instructions override the previous ones.

Use `ONBUILD` to always run the instruction that follows when building - even when building a downstream container image:

    Step 0 : FROM myusername/sshd-example
    # Executing 1 build triggers
    Trigger 0, ADD sshd_config /etc/ssh/sshd_config
    Step 0 : ADD sshd_config /etc/ssh/sshd_config
     ---> 5e56e2bf6791
    Removing intermediate container 64b86944f044
    ...

Link your GitHub account onto the docker hub - automated builds, which will kick in after every commit. You can also specify dependencies on other docker repos.

Docker can allow us to set resource limitations. The `-c=10` command is relative to what you give other processes.

Docker limitations only work against *used* memory, not allocated. You specify those like `-m=256mb` (note the units).

If you get errors like the below:

    WARNING: Your kernel does not support swap limit capabilities. Limitation discarded.

Make sure your kernel has the right `cgroups` set up as described [here](https://docs.docker.com/engine/installation/linux/ubuntulinux/).

If the `ENTRYPOINT` directive has been issued, it can be overridden:

    vagrant@vagrant-ubuntu-wily-64:~$ docker run -ti --entrypoint=/bin/sh donaldsimpson/memalloc

By default a container runs as root. We can override the user `-u=nobody` for instance:

    vagrant@vagrant-ubuntu-wily-64:~$ docker run --rm -ti -u=nobody ubuntu bash
    nobody@0bddd2b4440d:/$ id
    uid=65534(nobody) gid=65534(nogroup) groups=65534(nogroup)

The user needs to exist!

Environment variables can be overriden with `-e`: `vagrant@vagrant-ubuntu-wily-64:~$ docker run --rm -it -e VAR1=foo ubuntu bash`. If you have many, you can store them in a key-value pair file and pass that with `--env-file=/path/to/file`.

Mounting directories inside a container is achieved via `-v [host_path]:[guest_path]`:

    vagrant@vagrant-ubuntu-wily-64:~$ mkdir mounts
    vagrant@vagrant-ubuntu-wily-64:~$ cd mounts/
    vagrant@vagrant-ubuntu-wily-64:~/mounts$ cat > hostfile
    Hello from the host system
    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run --rm -it -v $(pwd):/mnt ubuntu bash
    root@c630d510a5d9:/# ls mnt/
    hostfile

By default the mounts are read-write but can be made as read-only via `:ro`: 

    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run --rm -it -v $(pwd):/mnt:ro ubuntu bash
    root@8fde5cf73b51:/# touch /mnt/some_new_file
    touch: cannot touch '/mnt/some_new_file': Read-only file system

Docker volumes are only 'live' whilst a container is running. But they're meant to be shared across containers like so:

    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run -d -v /var/volume1 donaldsimpson/memalloc 256
    0e1201dcd76004632f839e66fedacb98d3171c41dba63899b12790f269e0c087
    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run --rm -ti  --volumes-from 0e1201 ubuntu bash
    root@7c206c611ac1:/# cd /var/volume1/
    root@7c206c611ac1:/var/volume1# touch foo
    root@7c206c611ac1:/var/volume1# exit
    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run --rm -ti  --volumes-from 0e1201 ubuntu bash
    root@52ec449d6589:/# ls /var/volume1/
    foo

Whilst a volume is still attached to a running (TBC!) container, it will remain live.

Ports in containers are not exposed unless explicitly told so. `EXPOSE` tells docker what port to expose to the host system.

    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run -d -P redis
    0c052674d81edbc1d848e2288a059c097a5dfeee2a98a5a02bd8705228d0bcf3
    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker ps
    CONTAINER ID        IMAGE               COMMAND                CREATED             STATUS              PORTS                     NAMES
    0c052674d81e        redis:latest        "/entrypoint.sh redi   3 seconds ago       Up 3 seconds        0.0.0.0:32768->6379/tcp   insane_hopper

We can also use `docker port`:

    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker port insane_hopper
    6379/tcp -> 0.0.0.0:32768

A port can be re-directed on the fly via `-p <public_port>:<private_port>`. An IP can also be specified like `-p 127.0.0.1:6379:6379`. This would ensure only localhost has access.

Outgoing connections can be prevented using the `--net="none"` (network is then disabled). This is useful for sandboxed environments.

By default, a container uses the host container. But `--dns=8.8.8.8` will override that.

Linking containers - there is no point exposing a port on a public IP only to have another container connecting to it via that public IP.

    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run -d --name=redis redis
    a5a2ca4a121d51bebb9045e6d397e5d2904e154be5f7ed94bcdaae4cc5c6d8b5
    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run --rm -it --link redis:db ubuntu bash
    root@7ae794e8ee9a:/# env
    ...
    DB_NAME=/adoring_fermat/db
    DB_PORT_6379_TCP_PORT=6379
    DB_PORT=tcp://172.17.0.23:6379
    DB_PORT_6379_TCP=tcp://172.17.0.23:6379
    DB_ENV_GOSU_VERSION=1.7
    DB_ENV_REDIS_DOWNLOAD_URL=http://download.redis.io/releases/redis-3.0.7.tar.gz
    DB_ENV_REDIS_VERSION=3.0.7
    DB_PORT_6379_TCP_ADDR=172.17.0.23
    DB_PORT_6379_TCP_PROTO=tcp
    DB_ENV_REDIS_DOWNLOAD_SHA1=e56b4b7e033ae8dbf311f9191cf6fdf3ae974d1c

This populates entries in the linked container's environment - in this case, everything starting with `DB`. We also see the `/etc/hosts` file has been prepopulated:

    root@7ae794e8ee9a:/# cat /etc/hosts | grep redis
    172.17.0.23     db a5a2ca4a121d redis

Example with the `redis` container:

    vagrant@vagrant-ubuntu-wily-64:~/mounts$ docker run --rm -it --link redis:redis redis bash
    root@07f0b4343821:/data# env | grep REDIS_PORT
    REDIS_PORT_6379_TCP_PROTO=tcp
    REDIS_PORT_6379_TCP_ADDR=172.17.0.23
    REDIS_PORT_6379_TCP_PORT=6379
    REDIS_PORT_6379_TCP=tcp://172.17.0.23:6379
    REDIS_PORT=tcp://172.17.0.23:6379
    root@07f0b4343821:/data# redis-cli -h $REDIS_PORT_6379_TCP_ADDR
    172.17.0.23:6379> set foo bar
    OK
    172.17.0.23:6379> get foo
    "bar"

This only works whilst containers don't need restarting and *are on the same host*.

New Dockerfile:

    FROM ubuntu
    MAINTAINER foo <foo@bar.com>
    
    RUN apt-get update
    RUN apt-get install -y python python-pip
    RUN pip install redis flask
    
    ADD ./hello.py /hello.py
    EXPOSE 8000
    CMD ["python", "/hello.py"]

Using a makefile is handy:

    vagrant@vagrant-ubuntu-wily-64:~/crashburn/pyred_app$ cat Makefile
    build:
            docker build -t myusername/helloworld .
    
If you like to use spaces instead of tab, `make` will complain. I use `ts=2` in vim so `unexpand --first-only -t 2 Makefile` does the trick. To show tabs in a file, you can use the below:

    vagrant@vagrant-ubuntu-wily-64:~/crashburn/pyred_app$ cat -etv Makefile
    build:$
    ^Idocker build -t myusername/helloworld .$

To deploy to, say, EC2 or DO, all you need to do is to create a local docker hub on your 'production' host. There is a dockerised version of docker hub: `docker pull samalba/docker-registry`. We can run it with a volume: `docker run -d -p 5000:5000 -v /tmp/registry:/tmp/registry smalba/docker-registry`. In case the application crashes, we can just restart it without having to repush our images.

To check the repo is up and running, use:

    vagrant@vagrant-ubuntu-wily-64:~/crashburn/pyred_app$ curl 10.0.2.15:5000/v1/_ping
    true

To push to a private repo, the docker image must be renamed: `docker tag myusername/helloworld 10.0.2.15:5000/myusername/helloworld`.

If you get errors regarding the repo being insecure, edit `/etc/default/docker` and change `DOCKER_OPTS` to `DOCKER_OPTS="--insecure-registry 10.0.2.15:5000"` - then resart the docker service (`sudo service docker stop/start`). You can then push using the standard `docker push`:

    vagrant@vagrant-ubuntu-wily-64:~/crashburn/pyred_app$ docker push 10.0.2.15:5000/myusername/helloworld
    The push refers to a repository [10.0.2.15:5000/myusername/helloworld] (len: 1)
    Sending image list
    Pushing repository 10.0.2.15:5000/myusername/helloworld (1 tags)
    dbcb51e048f9: Image successfully pushed
    4e910c38549a: Image successfully pushed
    d43cf1f769e9: Image successfully pushed
    a572fb20fc42: Image successfully pushed
    57d821f7e039: Image successfully pushed
    1131754cc2e1: Image successfully pushed
    1e56c45bad45: Image successfully pushed
    8c94400220e3: Image successfully pushed
    70aa07b01d4b: Image successfully pushed
    7af91f9afe5f: Image successfully pushed
    3e9e54676dff: Image successfully pushed
    Pushing tag for rev [3e9e54676dff] on {http://10.0.2.15:5000/v1/repositories/myusername/helloworld/tags/latest}

You can then import it on your local machine: `docker pull 10.0.2.15:5000/myusername/helloworld`, which will bring the image to the local host.

Given the deploy script below (living on the 'prod' machine):

    #!/bin/bash
    set -e
    ip="10.0.2.15" #"$(curl icanhazip.com -s)"
    name="$1"
    version="$2"
    port="8000"
    registry="$ip:5000"
    
    echo "pulling $version from registry..."
    docker pull $registry/$name:$version > /dev/null
    docker tag -force $registry/$name:$version $name:$version
    echo "stopping existing version"
    docker rm -f $(docker ps | grep $name | cut -d ' ' -f 1) > /dev/null 2>&1 || true
    echo "starting version $version"
    docker run -d -P --link redis:db $name:$version > /dev/null
    echo "name deployed:"
    echo "  $(docker port `docker ps -lq` $port | sed s/0.0.0.0/$ip/)"


We can update our makefile to make deployment a one-liner:

    VERSION=current
    HOST=10.0.2.15
    
    all: build deploy
    
    build:
            docker build -t myusername/helloworld .
            docker tag -force myusername/helloworld $(HOST):5000/myusername/helloworld:$(VERSION)
    
    deploy:
            docker push $(HOST):5000/myusername/helloworld:$(VERSION)
            ssh vagrant@$(HOST) ./crashburn/pyred_app/deploy-app myusername/helloworld $(VERSION)

You can override the makefile's variables like `make VERSION=v1`.

The Docker CLI actually communicates to a server over a unix socket. We can make it communicate over HTTP. Open `/etc/init.d/docker` and change `DOCKER_OPTS` to `-H tcp://127.0.0.1:4243 -H unix:///var/run/docker.sock` (note in some distros, you'll want to update `/etc/default/docker` instead - c.f. above).

Docker remote API is documented [here](https://docs.docker.com/engine/reference/api/docker_remote_api/).

    vagrant@vagrant-ubuntu-wily-64:~$ curl 127.0.0.1:4243/_ping
    OKvagrant@vagrant-ubuntu-wily-64:~$
    vagrant@vagrant-ubuntu-wily-64:~$ curl 127.0.0.1:4243/containers/json
    [{"Command":"python /hello.py","Created":1462658866,"Id":"94f7d0998a2daf6f462a241e31405fb545ae4573c211dca84899778cc9d291eb","Image":"myusername/helloworld:latest","Labels":{},"Names":["/serene_hoover"],"Ports":[{"IP":"0.0.0.0","PrivatePort":80,"PublicPort":8090,"Type":"tcp"},{"PrivatePort":8000,"Type":"tcp"}],"Status":"Up 2 minutes"}

You can use `curl` to start an image:

    vagrant@vagrant-ubuntu-wily-64:~$ curl localhost:4243/containers/create -X POST -H "Content-Type: application/json" -d '{"Image": "ubuntu", "Cmd":["echo","Hello world"]}'
    {"Id":"63354c7a992398d483d612d8bf13acd385ffb6f92efae64ab3549d2d87abe03b","Warnings":null}

An endpoint with the container id has been created. We can use this to interact with the container:

    vagrant@vagrant-ubuntu-wily-64:~$ curl localhost:4243/containers/63354c7a992398d483d612d8bf13acd385ffb6f92efae64ab3549d2d87abe03b/start -X POST                         vagrant@vagrant-ubuntu-wily-64:~$ curl localhost:4243/containers/63354c7a992398d483d612d8bf13acd385ffb6f92efae64ab3549d2d87abe03b/logs?stdout=1
    Hello world!

There is a `docker-py` module, which we can install with `pip`. If you get an error in regards to an API version mismatch between the client and server, you'll need to specify the API version:

    >>> import docker
    >>> client = docker.Client()
    >>> client.containers()
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
      File "/home/vagrant/crashburn/pyred_app/local/lib/python2.7/site-packages/docker/api/container.py", line 70, in containers
        res = self._result(self._get(u, params=params), True)
      File "/home/vagrant/crashburn/pyred_app/local/lib/python2.7/site-packages/docker/client.py", line 158, in _result
        self._raise_for_status(response)
      File "/home/vagrant/crashburn/pyred_app/local/lib/python2.7/site-packages/docker/client.py", line 153, in _raise_for_status
        raise errors.NotFound(e, response, explanation=explanation)
    docker.errors.NotFound: 404 Client Error: Not Found ("client and server don't have same version (client : 1.22, server: 1.18)")
    >>> client = docker.Client(version='1.18')
    >>> client.containers()
    [{u'Status': u'Up 11 minutes', u'Created': 1462658866, u'Image': u'myusername/helloworld:latest', u'Labels': {}, u'Ports': [{u'Type': u'tcp', u'PrivatePort': 8000}, {u'IP': u'0.0.0.0', u'Type': u'tcp', u'PublicPort': 8090, u'PrivatePort': 80}], u'Command': u'python /hello.py', u'Names': [u'/serene_hoover'], u'Id': u'94f7d0998a2daf6f462a241e31405fb545ae4573c211dca84899778cc9d291eb'}]

And the library is somewhat simpler to use than curl:

    >>> container = client.create_container("ubuntu", "echo foobar")
    >>> client.start(container)
    >>> client.logs(container)
    'foobar\n'
    
You can expose the docker service from the host to containers - so control can be delegated to other containers. Easiest way is to mount the docker socket inside the container: `docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock ubuntu bash`. In the container, you can just download the binary: `root@17e35c73f1b4:/# wget -O /usr/bin/docker https://get.docker.com/builds/Linux/x86_64/docker-1.6.0`.

    root@17e35c73f1b4:/# chmod +x /usr/bin/docker
    root@17e35c73f1b4:/# docker ps
    CONTAINER ID        IMAGE                          COMMAND              CREATED             STATUS              PORTS                            NAMES
    17e35c73f1b4        ubuntu:latest                  "bash"               2 minutes ago       Up 2 minutes                                         happy_fermat
    94f7d0998a2d        myusername/helloworld:latest   "python /hello.py"   21 minutes ago      Up 21 minutes       8000/tcp, 0.0.0.0:8090->80/tcp   serene_hoover
    root@17e35c73f1b4:/# docker run --rm -it ubuntu bash
    root@eafeb4696aa7:/# echo foo
    foo

Container within a container. Nifty heh. Though note the 'sub' container is still managed by the host's docker service.
