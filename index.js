'use strict';

var inquirer = require('inquirer');
var chalk    = require('chalk');
var Humanize = require('humanize-plus');
var cowsay   = require('cowsay');
var _        = require('lodash');

var debug = process.env.DEBUG || false;
var maxAttempts = process.env.ATTEMPS || 10;

var questions = {
  where: {
    type: 'input',
    name: 'where',
    message: 'Where am I?',
    validate: function(input) {
      if(!input.match(/^[0-9],[0-9]$/)) {
        return 'Invalid match. The answer must be in the 0,0 format';
      }
      var point = parsePosition(input);
      if(point.x < 1 || point.x > 5) {
        return 'The X position must be between 1 and 5';
      }
      if(point.y < 1 || point.y > 5) {
        return 'The Y position must be between 1 and 5';
      }
      return true;
    }
  },
  again: {
    type: 'confirm',
    name: 'again',
    message: 'Do you want to try again?',
    default: true
  }
};

var getShipPosition = function () {
  var x = parseInt(Math.random() * 5) + 1;
  var y = parseInt(Math.random() * 5) + 1;

  if(debug) {
    console.log(chalk.gray('[DEBUG] ship position: ' + x + ',' + y));
  }
  
  return {
    x: x,
    y: y
  };
}

var renderPosition = function(point) {
  return point.x + ',' + point.y;
};

var parsePosition = function(input) {
  var point = input.split(',')
  return { x: point[0], y: point[1] };
};

var matchPosition = function(where, shipPosition) {
  return where.x === shipPosition.x &&
         where.y === shipPosition.y;
};

var lost = function(shipPosition, boardStatus) {
  console.log(chalk.red('Sorry, you lost.'));

  printBoard(boardStatus, shipPosition);
};

var won = function() {
  console.log(chalk.green('Great! You hit the ship!'));
};

var tryAgain = function(callback) {
  console.log('');
  inquirer.prompt([questions.again], function(answers) {
    return callback(answers.again); 
  });
}

var printBoard = function(tries, shipPosition) {
  _.range(1, 6).forEach(function(x) {
    var row = "";
    _.range(1, 6).forEach(function(y) {
      if(tries[y] && tries[y][x]) {
        row += chalk.red("[x]");
      }
      else if(shipPosition && matchPosition({x: x, y: y}, shipPosition)) {
        row += chalk.bold.blue("[o]");
      }
      else {
        row += "[ ]";
      }
    });
    console.log(row);
  });
}

var play = (function() {
  var tries = 1;
  var shipPosition = getShipPosition();
  var boardStatus = {};
  return function() {
    console.log('')
    console.log('This is your ' + chalk.blue(Humanize.ordinal(tries)) + ' try');
    console.log('Your board:');
    printBoard(boardStatus);

    inquirer.prompt([questions.where], function(answers) {
      var target = parsePosition(answers.where);
      var match = matchPosition(target, shipPosition);

      boardStatus[target.x] =  boardStatus[target.x] || {};
      boardStatus[target.x][target.y] = true;

      if(match) {
        return won();
      }
      tries++;
      if(tries > maxAttempts) {
        lost(shipPosition, boardStatus);
        return tryAgain(function(retry) {
          if(!retry) return ;
          tries = 1;
          shipPosition = getShipPosition();
          play();
        });
      }
      play();
    });
  }
})();

console.log(cowsay.say({
  text: 'Lets play some battleship',
  e: 'Oo',
  T: 'U'
}));

console.log('');
play();

