 //check out wiki for more info
 const {should,expect,assert} = require("chai");




 const oneEqualsone = require('./private/anExampleTest.js').oneEqualsone;
 describe("Basic Test for anExampleTest:",function(){
    it("-One should in fact equal one",function(){
        expect(oneEqualsone()).to.be.true;
    });
    it("-2 + 2 should equal four",function(){
        expect(2+2).to.equal(4);
    })
    it("-properties should exist",function(){
        assert.property({aProperty:1},'aProperty');
    })
 });
