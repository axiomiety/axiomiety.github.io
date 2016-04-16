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
