'use strict';

const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);


//***** Funtion to Seed the Database  ******/
function seedBlogData() {
    console.info('seeding blog data');
    const seedData = [];
  
    for (let i=1; i<=10; i++) {
      seedData.push(generateBlogData());
    }
    console.log("Done with Push");
    // this will return a promise
    return BlogPost.insertMany(seedData);
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
  
  //console.log(generateBlogData()) ;
