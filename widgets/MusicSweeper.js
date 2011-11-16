/**
* Music Sweeper.  Programmed by David Marron
 */
dojo.provide('myapp.MusicSweeper');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dijit.form.TextBox');
dojo.require('dijit.form.CheckBox');
dojo.require('dojox.timing._base');
dojo.require('dojo.i18n');
dojo.require('dojo.number');
//dojo.require('uow.audio.JSonic');
dojo.requireLocalization('myapp', 'MusicSweeper');

dojo.declare('myapp.MusicSweeper', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
	templatePath: dojo.moduleUrl('myapp.templates', 'sweeper.html'),

	postCreate: function() {
		this.connect(window,'onkeyup','_onKeyPress');
		this.connect(window,'onkeydown','_onKeyDown');
		this.connect(window,'onclick','_onClick');
		dojo.connect(dojo.doc, 'onkeypress', function(event) {
            if(event.target.size === undefined &&
               event.target.rows === undefined &&
               event.keyCode == dojo.keys.BACKSPACE) {
                // prevent backspace page nav
                //event.preventDefault();
            }
        } );
		this.introPage();
	},
    postMixInProperties: function() {
		//initialize jsonic from unc open web
		//uow.getAudio({defaultCaching: true}).then(dojo.hitch(this, function(js) { this.js = js; }));
		this.numberWrong = 16;
		this.mode = "intro";
		this.size = 9;
		this.maxLives = 3;
		this.xPos = 0;
		this.yPos = 0;
		this.bump = 0;
		this.cleared = 0;
		this._ext = ".mp3";
		grid = new Array();
		//grid = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
    },
	_onClick: function(e) {
		
	},
	_onKeyDown: function(e) {
		
	},
	_onKeyPress: function(e) {
		if (this.mode == "game") {
			if (e.keyCode == 37) {
				//left arrow
				if (this.xPos > 0) {
					this.xPos--;
					this.updateSquare(this.xPos+1,this.yPos);
				} else {
					this.playBump();
				}
				
			} else if (e.keyCode == 39) {
				//right arrow
				if (this.xPos < this.size-1) {
					this.xPos++;
					this.updateSquare(this.xPos-1,this.yPos);
				} else {
					this.playBump();
				}
			} else if (e.keyCode == 38) {
				//up arrow
				if (this.yPos > 0) {
					this.yPos --;
					this.updateSquare(this.xPos,this.yPos+1);
				} else {
					this.playBump();
				}
			} else if (e.keyCode == 40) {
				//down arrow
				if (this.yPos < this.size-1) {
					this.yPos ++;
					this.updateSquare(this.xPos,this.yPos-1);
				} else {
					this.playBump();
				}
			} else if (e.keyCode == 32) {
				//space pressed
				this.selectSquare();
			} else if (e.keyCode == 16) {
				//space pressed
				this.placeFlag();
			}
		} else if (this.mode == "intro") {
			if (e.keyCode == 32) {
				//space pressed
				this.mode = "game";
				this.initialBoard();
			} else if (e.keyCode == 38) {
				//up arrow
				if (this.numberWrong < this.size*this.size/2) {
					this.numberWrong ++;
					this.drawIntroPage();
				}
			} else if (e.keyCode == 40) {
				//down arrow
				if (this.numberWrong > 5) {
					this.numberWrong --;
					this.drawIntroPage();
				}
			} else if (e.keyCode == 37) {
				//left arrow
				if (this.size > 5) {
					this.size --;
					this.numberWrong = Math.round(this.size*this.size/5.2);
					this.drawIntroPage();
				}
			} else if (e.keyCode == 39) {
				//right arrow
				if (this.size < 16) {
					this.size ++;
					this.numberWrong = Math.round(this.size*this.size/5.2)
					this.drawIntroPage();
				}
			} else if (e.keyCode >= 49 && e.keyCode <= 57) {
				this.maxLives = e.keyCode - 48;
				this.drawIntroPage();
			}
		}
	},
	updateSquare: function(oldX,oldY) {
		var ctx = canvas.getContext("2d");
		var squaresize = Math.round((30-this.size)/0.42);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#fff";
		var drawX = 40+oldX*squaresize;
		var drawY = 60+oldY*squaresize;
		ctx.strokeRect(drawX,drawY,squaresize,squaresize);
		ctx.strokeRect(drawX,drawY,squaresize,squaresize);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#000";
		ctx.strokeRect(drawX,drawY,squaresize,squaresize);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#fff";
		drawX = 40+this.xPos*squaresize;
		drawY = 60+this.yPos*squaresize;
		ctx.strokeRect(drawX,drawY,squaresize,squaresize);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "red";
		ctx.strokeRect(drawX,drawY,squaresize,squaresize);
	},
	selectSquare: function() {
		var ctx = canvas.getContext("2d");
		ctx.font = 32-this.size + "pt Trebuchet MS";
		var squaresize = Math.round((30-this.size)/0.42);
		ctx.lineWidth = 2;
		ctx.fillStyle = "#000";
		if (grid[this.xPos][this.yPos].flag == 1) {
			//say "flag removed"
			grid[this.xPos][this.yPos].flag = 0;
			ctx.fillStyle = "#fff";
			//erase flag
			ctx.fillRect(40+this.xPos*squaresize+5,60+this.yPos*squaresize+5,squaresize-10,squaresize-10);
		} else if (grid[this.xPos][this.yPos].selected == 0) {
			if (this.cleared == 0) {
				//always uncover a square with 0 adjacent wrong notes on first selection
				grid[this.xPos][this.yPos].wrong = 0;
				grid[this.xPos][this.yPos].selected = 1;
				if (this.yPos < this.size-1) {
					grid[this.xPos][this.yPos+1].wrong = 0;
				}
				if (this.xPos < this.size-1) {
					grid[this.xPos+1][this.yPos].wrong = 0;
					if (this.yPos < this.size-1) {
						grid[this.xPos+1][this.yPos+1].wrong = 0;
					}
				}
				if (this.xPos > 0) {
					grid[this.xPos-1][this.yPos].wrong = 0;
					if (this.yPos < this.size-1) {
						grid[this.xPos-1][this.yPos+1].wrong = 0;
					}
					if (this.yPos > 0) {
						grid[this.xPos-1][this.yPos-1].wrong = 0;
					}
				}
				if (this.yPos > 0) {
					grid[this.xPos][this.yPos-1].wrong = 0;
					if (this.xPos < this.size-1) {
						grid[this.xPos+1][this.yPos-1].wrong = 0;
					}
				}
				this.populateGrid();
			}
			this.cleared++;
			grid[this.xPos][this.yPos].selected = 1;
			var drawX = 40+this.xPos*squaresize+Math.round(squaresize/3.2);
			var drawY = 80+this.yPos*squaresize+Math.round(squaresize/3.4)+(9-this.size);
			if (grid[this.xPos][this.yPos].wrong == 1) {
				ctx.fillStyle = "red";
				ctx.fillText("X",drawX,drawY);
				this.cleared --;
			} else {
				ctx.fillText(grid[this.xPos][this.yPos].number,drawX,drawY);
			}
			if (this.cleared >= this.size*this.size-this.numberWrong) {
				console.log("won game");
				//game won
			}		
		}
	},
	placeFlag: function() {
		if (grid[this.xPos][this.yPos].selected == 0) {
			if (grid[this.xPos][this.yPos].flag == 0) {
				grid[this.xPos][this.yPos].flag = 1;
				var ctx = canvas.getContext("2d");
				ctx.font = 32-this.size + "pt Trebuchet MS";
				var squaresize = Math.round((30-this.size)/0.42);
				ctx.lineWidth = 2;
				ctx.fillStyle = "#000";
				var drawX = 40+this.xPos*squaresize+Math.round(squaresize/3.2);
				var drawY = 80+this.yPos*squaresize+Math.round(squaresize/3.4)+(9-this.size);
				ctx.fillText("F",drawX,drawY);
			} else {
				this.selectSquare();
			}
		}
	},
	playBump: function() {
		if (this.bump == 0) {
			this.bump = 1;
			//this.sounds[4].play();
		} else {
			this.bump = 0;
			//this.sounds[5].play();
		}
	},
	populateGrid: function() {
		var spacesLeft = new Array();
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				if (grid[i][j].wrong == -1) {
					spacesLeft.push(i + this.size*j);
				}
			}
		}
		var rand = 0;
		var temp = 0;
		for (var i = 0; i < spacesLeft.length; i++) {
			rand = Math.floor(spacesLeft.length*Math.random());
			temp = spacesLeft[rand];
			spacesLeft[rand] = spacesLeft[i];
			spacesLeft[i] = temp;
		}
		for (var i = 0; i < this.numberWrong; i++) {
			var row = Math.floor(spacesLeft[i]/this.size);
			var col = spacesLeft[i] - this.size*row;
			grid[row][col].wrong = 1;
		}
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				if (grid[i][j].wrong == -1) {
					grid[i][j].wrong = 0;
				}
				grid[i][j].number = this.countAdjacent(i,j);
			}
		}
	},
	countAdjacent: function(x,y) {
		var count = 0;
		if (x > 0) {
			if (grid[x-1][y].wrong == 1) {
				count++;
			}
			if (y > 0) {
				if (grid[x-1][y-1].wrong == 1) {
				count++;
				}
			}
			if (y < this.size-1) {
				if (grid[x-1][y+1].wrong == 1) {
				count++;
				}
			}
		}
		if (x < this.size-1) {
			if (grid[x+1][y].wrong == 1) {
				count++;
			}
			if (y > 0) {
				if (grid[x+1][y-1].wrong == 1) {
				count++;
				}
			}
			if (y < this.size-1) {
				if (grid[x+1][y+1].wrong == 1) {
				count++;
				}
			}
		}
		if (y > 0) {
			if (grid[x][y-1].wrong == 1) {
				count++;
			}
		}
		if (y < this.size-1) {
			if (grid[x][y+1].wrong == 1) {
				count++;
			}
		}
		return count;
	},
	drawSolution: function() {
		var ctx = canvas.getContext("2d");
		ctx.font = "20pt Trebuchet MS";
		var squaresize = Math.round((30-this.size)/0.42);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#fff";
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				var drawX = 40+i*squaresize;
				var drawY = 80+j*squaresize;
				if (grid[i][j].wrong == 1) {
					ctx.fillText("X",drawX,drawY);
				} else {
					ctx.fillText(grid[i][j].number,drawX,drawY);
				}
			}
		}	
	},
	initialBoard: function(event) {
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 2;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		var squaresize = Math.round((30-this.size)/0.42);
		for (var i = 0; i < this.size; i++) {
			grid[i] = new Array();
			for (var j = 0; j < this.size; j++) {
				ctx.strokeRect(40+i*squaresize,60+j*squaresize,squaresize,squaresize);
				var square = {
					wrong: -1,
					flag: 0,
					number: -1,
					selected: 0
				}
				grid[i][j] = square;
			}
		}
		this.xPos = 0;
		this.yPos = 0;
		this.updateSquare(0,0);
		this.cleared = 0;
	},
	drawIntroPage: function(event) {
		this.mode = "intro";
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.save();
		ctx.font = "80pt Trebuchet MS";
		ctx.fillText("Music Sweeper",50,110);
		ctx.font = "40pt Trebuchet MS";
		ctx.fillText("Press space to play",150,190);
		ctx.font = "20pt Trebuchet MS";
		ctx.fillText("Press up and down to set the number of wrong notes",50,270);
		ctx.fillText("Wrong notes: " + this.numberWrong,50,310);
		ctx.fillText("Press left and right to change the size of the board",50,350);
		ctx.fillText("Current board size: " + this.size + " x " + this.size,50,390);
		ctx.fillText("Press the number keys to set the number of lives",50,430);
		ctx.fillText("Number of lives: " + this.maxLives,50,470);
		ctx.restore();
	},
	introPage: function(event) {
		dojo.empty(this.generateDiv);
		canvas = dojo.doc.createElement('canvas');
		canvas.setAttribute('width',750); 
		canvas.setAttribute('height',750); 
		dojo.place(canvas, this.generateDiv);
		this.drawIntroPage();
	},
});