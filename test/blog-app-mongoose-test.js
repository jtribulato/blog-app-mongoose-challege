'use strict';

const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const expect = chai.expect;
const should = chai.should();    // important allows .should to be used

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');   // why are {} around these variables  when on lines 61 their not around it?

chai.use(chaiHttp);






function seedBlogData() {
    console.info('seeding blog data');
    const seedData = [];
    
    for (let i=1; i<=10; i++) {
        seedData.push(generateBlogData());
    }  
    //console.log(seedData);      //seedData array is full of data at this point
    // this will return a promise
    return BlogPost.insertMany(seedData);    //This is a promise as in it hasn't actually inserted anything yet
}

function generateBlogData() {
    return {
        title: faker.company.catchPhrase(),
        author: 
        {
            firstName : faker.name.firstName(),
            lastName : faker.name.lastName(),
        },
        content: faker.lorem.sentences()
    };
}

function tearDownDb() {
    return new Promise((resolve, reject) => {
        console.warn('Deleting database');       // what is diff between warn and log
        mongoose.connection.dropDatabase()
        .then(result => resolve(result))    // does this show the database status
        .catch(err => reject(err));
    });
}




describe('blog posts API resource', function () {
    
    before(function(){
        return runServer(TEST_DATABASE_URL);
    }); 
    beforeEach(function(){
        return seedBlogData(); 
    }); 
    afterEach(function(){
        return tearDownDb();   //deletes the database
    }); 
    after(function(){
        return closeServer();
    }); 
    
    // GET
    describe('GET posts test', function () {
        
        it('should return all existing posts that were just seeded', function () {
            
            let res;
            return chai.request(app)    // chai is initiating a request here
            .get('/posts')  // here that request is defined as a GET req
            .then(_res => {    
                res = _res;    // _res is sent to this block  as res
                res.should.have.status(200);            // res is checked for status 200   ...there is a status: 200 in response ?? this has issue with (.have) why?
                expect(res).to.have.status(200);  // this works  and is a diff way of checking for status 200  
                res.body.should.have.lengthOf.at.least(1);     // res is checked for at least a length of 1  
                
                return BlogPost.count();       // I believe this is promise to used in the next .then
            })
            .then(count => {
                // the number of returned posts should be same
                // as number of posts in DB
                res.body.should.have.lengthOf(count);   
            });
        });
        
        it('should test for field values', function () {
            let resPost;
            return chai.request(app)    
            .get('/posts')  
            .then(res => {     
                
                res.should.have.status(200); 
                res.should.be.json;           
                res.body.should.be.a('array');    // so i can find one and test it 
                res.body.should.have.lengthOf.at.least(1);
                //loop thru the array
                res.body.forEach(function (post) {
                    post.should.be.a('object');
                    post.should.include.keys('id', 'title', 'content', 'author', 'created');
                });
                
                resPost = res.body[0];
                console.log(resPost);
                return BlogPost.findById(resPost.id);     
            })
            .then(post => {
                resPost.title.should.equal(post.title);
                resPost.content.should.equal(post.content);
                resPost.author.should.equal(post.authorName);
            });
        }); 
        
    });
    
    // POST
    ``
    // PUT
    
    // DELETE
    
});