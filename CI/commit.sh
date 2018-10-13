isDevBranch=$(git branch | grep "* dev")
if [ "$isDevBranch" == "" ]
then
    echo "~ not on dev branch";
    exit 1
fi


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

printf "\n";
echo "~ $counter/$numberOfTest tests passed!";
printf "\n";

if [ "$counter" == "$numberOfTest" ];
then
    echo "~ checking git status";
    statusPass=$(git status | grep "no changes added to commit")
    if [ "$statusPass" != "" ];
    then
        echo "~ no changes to commit";
    else
        echo "~ attempting to commit changes";
        if [ "$1" == "" ];
        then
            echo "~ no commit message provided";
        else
            git commit -m "$1" &> /dev/null;
            echo "~ attempting push";
            echo $(git push origin dev) 
        fi

    fi 
else
    echo "~ Failed test - fix before checking in";
fi


rm testdata
printf "\n"







