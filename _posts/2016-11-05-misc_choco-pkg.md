---
layout: post
title: choco-pkg
excerpt: "Creating a package for Chocolatey."
categories: [tech]
tags: [automation, howto]
comments: false
---

[Chocolatey](https://chocolatey.org/) is a package manager for Windows. If you're familiar with `apt` or `rpm` on Linux, that's very similar - all it takes is a `choco install <package name>` to get going.

There are tons of packages already available for popular software like firefox, putty etc... but somehow no package was available for [J](http://www.jsoftware.com/). We'll use this to work through the necessary steps.

## Package definition

Chocolatey leverages [NuGet](https://www.nuget.org/). You can find out more about the differences [here](http://stackoverflow.com/questions/24662550/difference-between-chocolatey-and-nuget), but essentially this is a 2-steps approach. We'll first define a NuGet spec (`.nuspec`) followed by a PowerShell installation script (`chocolateyinstall.ps1`).

Kick off the initial process with `choco new jlang`. This will create the necessary stubs.

    c:\temp>choco new jlang
    Chocolatey v0.10.3
    Creating a new package specification at c:\temp\jlang
    Generating template to a file
    at 'c:\temp\jlang\jlang.nuspec'
    Generating template to a file
    at 'c:\temp\jlang\tools\chocolateyinstall.ps1'
    Generating template to a file
    at 'c:\temp\jlang\tools\chocolateybeforemodify.ps1'
    Generating template to a file
    at 'c:\temp\jlang\tools\chocolateyuninstall.ps1'
    Generating template to a file
    at 'c:\temp\jlang\tools\LICENSE.txt'
    Generating template to a file
    at 'c:\temp\jlang\tools\VERIFICATION.txt'
    Generating template to a file
    at 'c:\temp\jlang\ReadMe.md'
    Successfully generated jlang package specification files
    at 'c:\temp\jlang'

### `jlang.nuspec`

Start by editing the nuspec file. It should look a little like this, with lots of comments (some of which have been omitted for clarity):

~~~ xml
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>jlang</id>
    <version>__REPLACE__</version>
    <title>jlang (Install)</title>
    <authors>__REPLACE_AUTHORS_OF_SOFTWARE_COMMA_SEPARATED__</authors>
    <!-- projectUrl is required for the community feed -->
    <projectUrl>https://_Software_Location_REMOVE_OR_FILL_OUT_</projectUrl>
    <!--<iconUrl>http://cdn.rawgit.com/__REPLACE_YOUR_REPO__/master/icons/jlang.png</iconUrl>-->
    <!-- <copyright>Year Software Vendor</copyright> -->
    <!-- If there is a license Url available, it is is required for the community feed -->
    <!-- <licenseUrl>Software License Location __REMOVE_OR_FILL_OUT__</licenseUrl>
    <requireLicenseAcceptance>true</requireLicenseAcceptance>-->
    <!--<projectSourceUrl>Software Source Location - is the software FOSS somewhere? Link to it with this</projectSourceUrl>-->
    <!--<docsUrl>At what url are the software docs located?</docsUrl>-->
    <!--<mailingListUrl></mailingListUrl>-->
    <!--<bugTrackerUrl></bugTrackerUrl>-->
    <tags>jlang admin SPACE_SEPARATED</tags>
    <summary>__REPLACE__</summary>
    <description>__REPLACE__MarkDown_Okay </description>
    ...
~~~

Filling this in is a little time consuming but a process you usually only go through once.

### `chocolateyinstall.ps1`

This is a PowerShell script that describes where to fetch the installer and how to run it. J comes as a 7zip SFX archive, meaning we can use the `Install-ChocolateyZipPackage` directive.

Make sure you fill in the checksums properly. E.g.:

    checksum      = '40E0445294E5F350F21D1E232B11A06D3925081EA20EE046106D8B9D38D8690D'
    checksumType  = 'sha256' #default is md5, can also be sha1, sha256 or sha512
    checksum64    = '05DC1B2CEFEB5A96DF8B975DFDBB45423CD8DB17B7458A076C5BDFDA0A8DD05D'
    checksumType64= 'sha256' #default is checksumType

You can get the checksums either through Microsoft's [File Checksum Integrity Verifier](https://www.microsoft.com/en-us/download/details.aspx?id=11533) or in the spirit of Chocolatey, via `checksum` which is obtained with `choco install checksum`.

Note there are two more files created by default - `chocolateybeforemodify.ps1` and `chocolateybeforemodify.ps1`. Because J is just an SFX those aren't required. But if you needed to do things like shut down services before an upgrade or had an MSI installer, those will come in handy.

## Testing it out

Create the pacakge with `choco pack`. You can then test it out with `choco install jlang -source "c:\path\to\lang" -f`.

## Submission

Once you have this, you're ready to submit the package to Chocolatey. Sign up for a free account and get an API key. Then:

    choco apikey -k [your API key] -source https://chocolatey.org
    choco push jlang.8.05.nupkg -s https://chocolatey.org

## Moderation and approval

In order for a package to be accepted, it needs to meet a few criterias - some of which are mandatory. From my experience with the above, those are the things I missed:

  * Leaving comments in the `*.ps1` files
  * Not getting rid of the `ps1` files I did not need
  * Not listing `chocolatey` as a dependency (which it is!)

Just for kicks, it's worth noting Chocolately will upload the contents of your package to VirusTotal. For J this means all files are essentially uploaded and checked for viruses against a number of antiviruses.

## References/Further reading

Chocolately has some very impressive documentation. Their [QuickStart](https://github.com/chocolatey/choco/wiki/CreatePackagesQuickStart) guide is easy to follow.

You can find the raw files for the `jlang` choco package [here](https://github.com/axiomiety/crashburn/tree/master/choco-jlang). 
