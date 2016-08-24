---
layout: post
title: powershell-batchrename
excerpt: "Using Powershell to rename files."
categories: [howto, bytesize]
tags: [powershell]
---

I had to rename a bunch of files that underwent conversion and well - doing this by hand wasn't an option. I could have used Python, but given Powershell now comes as standard I thought it'd be easier than to introduce a new dependency (and the opportunity to try something new!).

The problem statement is straight forward - each file has a position, like `abc_01.jpg` or `def_2.png`. I wanted to keep the order and provide a new basename - all without using regular expressions.

{%highlight powershell%}
Function batchRename{
    Param([string] $dir, [string] $basename, [switch] $dryRun)
    $count = 1
    Write-Host "Base directory: $dir"
    foreach ($file in Get-ChildItem $dir -File) {
        $new_name = "{0}{1}{2}" -f $basename, $count.ToString("00"), [System.IO.Path]::GetExtension($file)
        if ($dryRun) {
            Rename-Item $file.FullName -NewName $new_name -WhatIf
        }
        else {
            Rename-Item $file.FullName -NewName $new_name
        }
        $count += 1
    }
    $count -= 1 # since we incremented one too many
    Write-Host "Renamed $count file(s)"
}
{% endhighlight %}

What took me some time to figure out though was how to run this. It turns out you have to start Powershell as an administrator. And then use `Set-ExecutionPolicy RemoteSigned` to enable you to run unsigned scripts. A bit heavy when in Linux I would have just used a Python script or some fancy piping (which I'm sure you can do here too).

Saying that the strongly-typed objects are actually pretty neat. Some bits aren't exactly straight-forward but they do make a lot of sense - like renaming a file by providing the new name, not the full path. Though given this was my first foray into Powershell, it would have certainly been faster to do this manually. But there's always next time.

