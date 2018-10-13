with open('testdata','r') as myfile:
    fileContent = myfile.read()
    index = fileContent.index("All files")
    reducedContent = fileContent[index:].split("|")
    coverage =  float(reducedContent[4])
    if coverage >= 50:
        print 'passed'
    else:
        print 'failed'
