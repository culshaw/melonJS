/* -----

	game object
		
	------			*/

	/************************************************************************************/
	/*																												*/
	/*		a player entity																					*/
	/*																												*/
	/************************************************************************************/
	var PlayerEntity = me.ObjectEntity.extend(
	{	
		init: function(x, y, settings)
		{
			// call the constructor
			this.parent(x, y , settings);
			
			// walking & jumping speed
			this.setVelocity(2, 13);
			
			// update the hit box
			this.updateColRect(12,8, -1,0);
			
			this.dying = false;
		
			// set the display around our position
			me.game.viewport.follow(this.pos, me.game.viewport.AXIS.HORIZONTAL);
					
			// enable the keyboard
			// walk
			me.input.bindKey(me.input.KEY.LEFT,	 "left");
			me.input.bindKey(me.input.KEY.RIGHT, "right");
			// jump
			me.input.bindKey(me.input.KEY.X,	"jump", true);
			// go left & right
			me.input.bindKey(me.input.KEY.UP,	"up");
			me.input.bindKey(me.input.KEY.DOWN,	"down");

			// walking animatin
			this.addAnimation ("walk",  [0,1,2,3]);
			// climbing animatin
			this.addAnimation ("climb", [4,5,6,7]);
			
			// set default one
			this.setCurrentAnimation("climb");
			
		},
		
		/* -----

			update the player pos
			
		------			*/
		update : function ()
		{
			
			var doClimb = false;
			
			if (me.input.isKeyPressed('left'))
			{
				this.doWalk(true);
			}
			else if (me.input.isKeyPressed('right'))
			{
				this.doWalk(false);
			}
			else
			{
				this.vel.x = 0;
			}
					
			if (me.input.isKeyPressed('up'))
			{
				doClimb = this.doClimb(true);
			}
			else if (me.input.isKeyPressed('down'))
			{
				doClimb = this.doClimb(false);
			}
			
			if (me.input.isKeyPressed('jump'))
			{	
				if (this.doJump()) 
				{
				  me.audio.play("jump", false);
				}
			}
			
			// check & update player movement
			updated = this.updateMovement();
					
			// check for collision with sthg
			var res = me.game.collide(this);
			
			if (res)
         {
            if (res.type == me.game.ENEMY_OBJECT)
            {
               if ((res.y>0) && !this.jumping)
               {
                  this.forceJump();
               }
               else
               {
                  this.die();
               }
            }
            else if (res.type == "spikeobject")
            {
               this.forceJump();
               this.die();
            }
			}
			
			if (updated)
			{
				// update the object animation
				if (this.onladder & doClimb)
				{
					this.setCurrentAnimation("climb");
				}
				else
				{
					this.setCurrentAnimation("walk");
				}
				this.parent();
				
			}
			return updated;
		},

		
		/* -----

			manage "diyng"
			
		------			*/
		die : function ()
		{
			if (!this.flickering)
			{
				//console.log("ouch");
				this.flicker(45);
				// flash the screen
				me.game.viewport.fadeIn("#FFFFFF", 5);
				me.audio.play("die", false);
			}
		},
		
		stopdying : function()
		{
			this.dying = false;
		}
	});
	/************************************************************************************/
	/*																												*/
	/*		a Emerald entity																					*/
	/*																												*/
	/************************************************************************************/
	var EmeraldEntity = me.CollectableEntity.extend(
	{	

		init: function (x, y, settings)
		{
			// define this here instead of tiled
			settings.image = "emerald";
			settings.spritewidth = 32;
			
			// call the parent constructor
			this.parent(x, y , settings);

			// animation speed		
			this.animationspeed = 8;
			
			// bounding box
			this.updateColRect(8,16,16,16);
		},		
			
		onDestroyEvent : function ()
		{
			// do something when collide
			me.audio.play("cling", false);
			// give some score
			me.game.HUD.updateItemValue("score", 250);
			
		}
		
	});
	/************************************************************************************/
	/*																												*/
	/*		an enemy Entity																					*/
	/*																												*/
	/************************************************************************************/
	var EnemyEntity = me.ObjectEntity.extend(
	{	
		init: function (x, y, settings)
		{
			// define this here instead of tiled
			settings.image = "arrowguy";
			settings.spritewidth = 24;
			
			// call the parent constructor
			this.parent(x, y , settings);
			
			this.startX = x;
			this.endX   = x+settings.width - settings.spritewidth; // size of sprite
			
			
			// make him start from the right
			this.pos.x = x + settings.width - settings.spritewidth;
			this.walkLeft = true;

         // walking & jumping speed
			this.setVelocity(1, 6);
			
         // make it collidable
			this.collidable = true;
			this.type = me.game.ENEMY_OBJECT;
		
			// bounding box
			this.updateColRect(-1,0,4,20);
			
			// walking animatin
			this.addAnimation ("walk", [0,1]);
			// dead animatin
			this.addAnimation ("dead", [2]);
			
			
			// set default one
			this.setCurrentAnimation("walk");
		},
		
		onDestroyEvent : function ()
		{
			// do something when collide
			//me.audio.play("cling", false);
				
		},
			
		onCollision : function (res)
		{
				
			// res.y >0 means touched by something on the bottom
			// which mean at top position for this one
			if (this.alive && (res.y > 0))
			{
				// make it dead
				this.alive = false;
				// and not collidable anymore
				this.collidable = false;
				// set dead animation
				this.setCurrentAnimation("dead");
				// make it flicker and call destroy once timer finished
				this.flicker(45, this.destroy.bind(this));
				// dead sfx
				me.audio.play("enemykill", false);
				
				// give some score
				me.game.HUD.updateItemValue("score", 150);
			}
		},

		
		// manage the enemy movement
		update : function ()
		{
			// do nothing if not visible
			if (!this.visible && !this.flickering)
				return false;
				
			if (this.alive)
			{
				if (this.walkLeft && this.pos.x <= this.startX)
				{
					this.walkLeft = false;
				}
				else if (!this.walkLeft && this.pos.x >= this.endX)
				{
					this.walkLeft = true;
				}
				
				//console.log(this.walkLeft);
				this.doWalk(this.walkLeft);
			}
			else
			{
				this.vel.x = 0;
			}
			// check & update movement
			updated = this.updateMovement();
				
			if (updated)
			{
				// update the object animation
				this.parent();
			}
			return updated;
		}
	});
	
	/************************************************************************************/
	/*																												*/
	/*		a Gui OBject																						*/
	/*																												*/
	/************************************************************************************/
	var ScoreObject = me.HUD_Item.extend(
	{	
		init: function(x, y)
		{
         // call the parent constructor
			this.parent(x, y);
			// create a font
			this.font = new me.BitmapFont("font16px", 16);
		},
		/* -----

			draw our score
			
		------			*/
		draw : function (context, x, y)
		{
			this.font.draw (context, this.value, this.pos.x +x, this.pos.y+y);
		}
	
	});
