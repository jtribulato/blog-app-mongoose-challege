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

function seedBlogData() {
    console.info('seeding blog data');
    const seedData = [];
    
    for (let i=1; i<=10; i++) {    // adding 10 blog posts
        seedData.push(generateBlogData());
    }  
    //seedData array is full of data at this point
    // this will return a promise
    return BlogPost.insertMany(seedData);    //This is a promise as in it hasn't actually inserted anything yet
}

function tearDownDb() {
    return new Promise((resolve, reject) => {
        console.warn('Deleting database');       
        mongoose.connection.dropDatabase()
        .then(result => resolve(result))    
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
                
                resPost = res.body[0];   //using first blog post in body array and assigning it to a variable
                //console.log(resPost);    // loging that post to the terminal just to check it visually
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
    describe('POST to the blog test', function () {
        
        // strategy: make a POST request with data,
        // then prove that the post we get back has
        // right keys, and that `id` is there (which means
        // the data was inserted into db)
        it('should add a new blog post', function () {
            
            const newPost = {
                title: faker.lorem.sentence(),
                author: {
                    firstName: faker.name.firstName(),
                    lastName: faker.name.lastName(),
                },
                content: faker.lorem.text()
            };
            
            return chai.request(app)
            .post('/posts')
            .send(newPost)
            .then(function (res) {
                res.should.have.status(201);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.include.keys(
                    'id', 'title', 'content', 'author', 'created');
                    res.body.title.should.equal(newPost.title);
                    // cause Mongo should have created id on insertion
                    res.body.id.should.not.be.null;
                    res.body.author.should.equal(
                        `${newPost.author.firstName} ${newPost.author.lastName}`);
                        res.body.content.should.equal(newPost.content);
                        // grab a post from database with this res.body.id
                        return BlogPost.findById(res.body.id);   
                    })
                    .then(function (post) {     
                        //  now check that post i just got from database 
                        //  and see if it matches the one I created in the beginning
                        post.title.should.equal(newPost.title);
                        post.content.should.equal(newPost.content);
                        post.author.firstName.should.equal(newPost.author.firstName);
                        post.author.lastName.should.equal(newPost.author.lastName);
                    });
                });
                
                
            })
            
            
            
            // PUT
            
            describe('PUT endpoint', function () {
                
                // strategy:
                //  1. Get an existing post from db
                //  2. Make a PUT request to update that post
                //  4. Prove post in db is correctly updated
                it('should update fields you send over', function () {
                    const updateData = {
                        title: 'cats cats cats',
                        content: 'dogs dogs dogs',
                        author: {
                            firstName: 'foo',
                            lastName: 'bar'
                        }
                    };
                    
                    return BlogPost
                    .findOne()
                    .then(post => {
                        updateData.id = post.id;   // assigns a database id to updateData.id
                        
                        return chai.request(app)
                        .put(`/posts/${post.id}`)
                        .send(updateData);
                    })
                    .then(res => {
                        res.should.have.status(204);
                        return BlogPost.findById(updateData.id);   // grab that post out of the database and verify the values
                    })
                    .then(post => {
                        post.title.should.equal(updateData.title);
                        post.content.should.equal(updateData.content);
                        post.author.firstName.should.equal(updateData.author.firstName);
                        post.author.lastName.should.equal(updateData.author.lastName);
                    });
                });
            });
            
            // DELETE
            describe('DELETE endpoint', function () {
                // strategy:
                //  1. get a post
                //  2. make a DELETE request for that post's id
                //  3. assert that response has right status code
                //  4. prove that post with the id doesn't exist in db anymore
                it('should delete a post by id', function () {
                    
                    let post;
                    
                    return BlogPost
                    .findOne()          //  ok got a post
                    .then(_post => {
                        post = _post;   // reassign to post
                        return chai.request(app)
                            .delete(`/posts/${post.id}`);    
                            // ok why cant i use _post instead of post ?  #question 
                            //maybe cause post has a scope of all of the describe block
                    })
                    .then(res => {
                        res.should.have.status(204);
                        return BlogPost.findById(post.id);
                    })
                    .then(_post => {
                        should.not.exist(_post);
                        

                    });
                });
            });
        });