Dir.chdir('./test')
command = "ruby -Ku testPointer.rb #{ARGV.join(' ')}"
print command
print `#{command}`
