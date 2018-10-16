
#check if on dev branch
isDevBranch=$(git branch | grep "* dev")
if [ "$isDevBranch" == "" ];
then
    echo "~ not on dev branch";
    printf "\n";
    exit 0
fi

#check if dev is up to date
isPulled=$(git pull origin dev | grep "Already up to date.")
if [ "$isPulled" == "" ];
then
    echo "~ branch is not in sync with dev - pull first";
    printf "\n";
    exit 0;
fi

printf "\n";

#run unit test and code coverage
numberOfTest=2
passCounter=0
npm test > testdata 2> /dev/null

unitTestPass=$(cat testdata);
if [ "$unitTestPass" == *"failing"* ];
then
    echo "- failed unit test";
else
    echo "+ passed unit test";
    counter=$((counter + 1));
fi

passedCodeCoverage=$(python ./CI/checkCodeCoverage.py)
if [ "$passedCodeCoverage" == "passed" ];
then
    echo "+ passed code coverage";
    counter=$((counter + 1));
else
    echo "- failed code coverage";
fi

echo "~ $counter/$numberOfTest tests passed!";
printf "\n";

#if the test were passex
if [ "$counter" == "$numberOfTest" ];
then
    #check if files are added to commit
    echo "~ checking git status";
    statusPass=$(git status | grep "no changes added to commit")
    if [ "$statusPass" != "" ];
    then
        echo "~ no changes to commit";
    else
        #check if argument was provided for commit message
        echo "~ attempting to commit changes";
        if [ "$1" == "" ];
        then
            echo "~ no commit message provided";
        else
            #commit and push
            git commit -m "$1" &> /dev/null;
            echo "~ attempting push";
            printf '\n';
            gitPass=$(git push origin dev 2>&1 | grep "To https://github.com/erwidman/cs4711_wiki.git")
            echo "$gitPass"
            #if push was successful 9
            if [ "$gitPass" == "" ] ;
            then
               echo "~ push failed!";
            else 
               echo $(pwd);
            fi
        fi

    fi 
else
    echo "~ Failed test - fix before checking in";
fi


rm testdata
printf "\n"







