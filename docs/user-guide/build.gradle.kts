import com.github.jyjeanne.DitaOtDownloadTask

plugins {
    id("io.github.jyjeanne.dita-ot-gradle") version "2.8.5"
}

val ditaOtVersion: String by project
val ditaOtHome = layout.buildDirectory.dir("dita-ot/dita-ot-$ditaOtVersion")
val isWindows = System.getProperty("os.name").lowercase().contains("win")

// ---------------------------------------------------------------------------
// Step 1 — Download DITA-OT
// ---------------------------------------------------------------------------
val downloadDitaOt by tasks.registering(DitaOtDownloadTask::class) {
    version.set(ditaOtVersion)
    destinationDir.set(layout.buildDirectory.dir("dita-ot"))
    retries.set(3)
}

// ---------------------------------------------------------------------------
// Step 2 — Integrate plugins (run `dita install` after fresh extraction)
// ---------------------------------------------------------------------------
val integrateDitaOt by tasks.registering {
    dependsOn(downloadDitaOt)
    val ditaHome = ditaOtHome.get().asFile
    val marker = File(ditaHome, ".integrated")
    onlyIf { !marker.exists() }

    doLast {
        val ditaBin = if (isWindows) File(ditaHome, "bin/dita.bat") else File(ditaHome, "bin/dita")
        val cmd = if (isWindows)
            listOf("cmd.exe", "/c", ditaBin.absolutePath, "install", "--force")
        else
            listOf(ditaBin.absolutePath, "install", "--force")

        val process = ProcessBuilder(cmd)
            .directory(ditaHome)
            .redirectErrorStream(true)
            .start()
        process.inputStream.bufferedReader().forEachLine { println(it) }
        val exitCode = process.waitFor()
        if (exitCode != 0) throw GradleException("dita install failed with exit code $exitCode")
        marker.writeText("integrated")
    }
}

/**
 * Run DITA-OT via Java directly (bypasses cmd.exe command line length limit).
 * Uses the DITA-OT Main class with the proper classpath.
 */
fun runDitaOt(ditaHome: File, projectDir: File, vararg args: String) {
    // Collect all jars from lib/ and plugin lib/ directories
    val classpath = mutableListOf<File>()
    File(ditaHome, "lib").listFiles()?.filter { it.extension == "jar" }?.let { classpath.addAll(it) }
    File(ditaHome, "config").let { if (it.exists()) classpath.add(it) }
    File(ditaHome, "resources").let { if (it.exists()) classpath.add(it) }
    // Add plugin jars and resources from env.bat/env.sh
    val envFile = if (isWindows) File(ditaHome, "config/env.bat") else File(ditaHome, "config/env.sh")
    if (envFile.exists()) {
        val pluginJarPattern = if (isWindows)
            Regex("""%DITA_HOME%\\(.+\.jar)""")
        else
            Regex("""\${'$'}DITA_HOME/(.+\.jar)""")
        envFile.readLines().forEach { line ->
            pluginJarPattern.find(line)?.let { match ->
                val relPath = match.groupValues[1].replace("\\", "/")
                val jar = File(ditaHome, relPath)
                if (jar.exists() && jar !in classpath) classpath.add(jar)
            }
        }
    }

    val javaExec = File(System.getProperty("java.home"), "bin/java")
    val cp = classpath.joinToString(File.pathSeparator) { it.absolutePath }

    val cmd = mutableListOf(
        javaExec.absolutePath,
        "-classpath", cp,
        "-Ddita.dir=${ditaHome.absolutePath}",
        "-Dant.home=${File(ditaHome, "lib").absolutePath}",
        "org.dita.dost.invoker.Main",
        *args
    )

    val process = ProcessBuilder(cmd)
        .directory(projectDir)
        .redirectErrorStream(true)
        .also { pb -> pb.environment()["DITA_HOME"] = ditaHome.absolutePath }
        .start()

    process.inputStream.bufferedReader().forEachLine { println(it) }
    val exitCode = process.waitFor()
    if (exitCode != 0) throw GradleException("DITA-OT failed with exit code $exitCode")
}

// ---------------------------------------------------------------------------
// Step 3 — Generate PDF from the DitaCraft User Guide
// ---------------------------------------------------------------------------
val pdf by tasks.registering {
    dependsOn(integrateDitaOt)
    group = "Documentation"
    description = "Generate PDF from DitaCraft User Guide"

    doLast {
        runDitaOt(
            ditaOtHome.get().asFile,
            project.projectDir,
            "--input=${file("ditacraft-user-guide.bookmap").absolutePath}",
            "--format=pdf",
            "--output=${file("build/output/pdf").absolutePath}",
            "--processing-mode=lax",
            "-Dpdf.formatter=fop",
            "-Dargs.chapter.layout=MINITOC",
            "-Dargs.gen.task.lbl=YES",
            "-Dargs.bookmap-order=retain",
            "-DoutputFile.base=ditacraft-user-guide"
        )
    }
}

// ---------------------------------------------------------------------------
// HTML5 output
// ---------------------------------------------------------------------------
val html by tasks.registering {
    dependsOn(integrateDitaOt)
    group = "Documentation"
    description = "Generate HTML5 from DitaCraft User Guide"

    doLast {
        runDitaOt(
            ditaOtHome.get().asFile,
            project.projectDir,
            "--input=${file("ditacraft-user-guide.bookmap").absolutePath}",
            "--format=html5",
            "--output=${file("build/output/html5").absolutePath}",
            "--processing-mode=lax",
            "-Dnav-toc=partial",
            "-Dargs.gen.task.lbl=YES",
            "-Dargs.copycss=yes"
        )
    }
}

defaultTasks("pdf")
