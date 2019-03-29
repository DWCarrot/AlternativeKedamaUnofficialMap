
switch ($args[0]) {
    "ts" {
        .\node_modules\.bin\tsc
        Write-Output -InputObject "ok.."
    }
    "css" {
        New-Item -Path ".\build" -Name "css" -ItemType "directory" -Force
        Copy-Item ".\src\css\*" ".\build\css\"
        Write-Output -InputObject "ok."
    }
    "clean" {
        Remove-Item -Recurse ".\build\"
        Write-Output -InputObject "ok..."
    }
    "server" {
        Start-Process .\node_modules\.bin\lite-server
    }
    Default {
        .\node_modules\.bin\tsc
        Write-Output -InputObject "ok.."
        New-Item -Path ".\build" -Name "css" -ItemType "directory" -Force
        Copy-Item ".\src\css\*" ".\build\css\"
        Write-Output -InputObject "ok." 
    }
}
