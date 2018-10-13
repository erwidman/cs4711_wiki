npm test > ./CI/testdata 2> /dev/null
sleep 1
PASSES_UNIT_TEST = $(python ./CI/checkUnitTest.py)
echo $PASSES_UNIT_TEST