const items = require('./items')

// Generic Inventory for mobs/block like chest, etc

class Inventory {
	constructor(size, data) {
		this.main = {}
		this.maxslot = size*9-1
		if (data != undefined && data != null) {
			this.main = data.main
		}

		for (var x = 0; x < size*9; x++) {
			if (this.main[x] == undefined) this.main[x] = {}
		}
		this.lastUpdate = Date.now()
	}

	add(item, count, data) {
		this.lastUpdate = Date.now()
		var invItems = Object.entries(this.main)
		for (var [slot, data] of invItems) {
			if (data.id == item && (data.count+count) < items.getStack(item) +1) {
				this.main[slot] = {id: item, count: count+data.count, data: data}
				return true
			}
		}
		for (var [slot, data] of invItems) {
			if (data.id == undefined) {
				this.main[slot] = {id: item, count: count, data: data}
				return true
			}
		}
		return false
	}

	remove(item, count) {
		this.lastUpdate = Date.now()
		var allItems = Object.entries(this.main)
		var sel = this.selected
		if (this.main[sel].id == item) {
			var newcount = this.main[sel].count-count
			count = count - this.main[sel].count
			if (newcount > 0) this.main[sel] = {id: item, count: newcount, data: this.main[sel].data}
			else this.main[sel] = {}
			if (count <= 0) return true
		}
		for (var [slot, data] of allItems) {
			if (count <= 0) return true
			if (data.id == item) {
				var newcount = data.count-count
				count = count - data.count
				if (newcount > 0) this.main[slot] = {id: item, count: newcount, data: data.data}
				else this.main[slot] = {}
			}
		}
		return true
	}

	set(slot, item, count, data) {
		this.lastUpdate = Date.now()
		this.main[slot] = {id: item, count: count, data: data}
	}

	contains(item, count) {
		var items = Object.entries(this.main)
	
		for (var [slot, data] of items) {
			if (data.id == item && data.count >= count) return slot
		}

		return -1
	}

}

// Inventory for players

class PlayerInventory extends Inventory {
	constructor(size, data) {
		super(size, data)
		if (data == undefined) {
			this.selected = 0
			this.tempslot = {}
		} else {
			this.selected = data.selected
			this.tempslot = data.tempslot
		}
		this.updated = false
	}

	select(slot) {
		this.selected = slot
	}

	getObject() {
		return {
			main: this.main,
			selected: this.selected,
			tempslot: this.tempslot
		}
	}

	getTool() {
		var sel = this.selected
		return this.main[sel]
	}

	action_switch(x, y) {
		this.lastUpdate = Date.now()
		this.updated = false
		var tempx = this.main[x]
		var tempy = this.main[y]
		this.main[x] = tempy
		this.main[y] = tempx
	}

	action_left(inv, x) {
		this.lastUpdate = Date.now()
		this.updated = false
		if (x >= 0) { // Normal slots
			var tempY = {...this.tempslot}
			var tempX = {...inv.main[x]}
			
			// If tempslot and target slot have the same itemtype
			if (tempY.id == tempX.id &&  tempY.id != undefined ) {
				if ((tempX.count + tempY.count) <= items.getStack(tempX.id) ) {
					var tempZ = {...tempX}
					tempZ.count = tempX.count + tempY.count
					inv.main[x] = tempZ
					this.tempslot = {}
				} else if ((tempX.count + tempY.count) > items.getStack(tempX.id) ) { 
					var tempZ = {...tempX}
					var tempW = {...tempY}
					tempZ.count = items.getStack(tempX.id)
					tempW.count = tempX.count + tempY.count - items.getStack(tempX.id)
					inv.main[x] = tempZ
					this.tempslot = tempW
				}
			}
			// If target slot has diffrent itemtype	
			else {
				inv.main[x] = tempY
				this.tempslot = tempX
			}
		}
		else if (x == -1) {
	
		}
	}

	action_right(inv, x) {
		this.lastUpdate = Date.now()
		this.updated = false
		// Normal slots
		if (x >= 0) {
			var tempY = {...this.tempslot}
			var tempX = {...inv.main[x]}
			if (tempY.id == undefined) { // Tempslot slot is empty
				var tempZ = {...tempX}
				var tempW = {...tempX}
				tempZ.count = Math.ceil(tempZ.count/2)
				tempW.count = Math.floor(tempW.count/2)
				if (tempW.count <= 0) tempW = {}
				inv.main[x] = {...tempZ}
				this.tempslot = {...tempW}
			} else if (tempX.id == undefined) { // Target is empty
				var tempZ = {...tempY}
				var tempW = {...tempY}
				tempZ.count = 1
				tempW.count = tempW.count - 1
				if (tempW.count <= 0) tempW = {}
				inv.main[x] = {...tempZ}
				this.tempslot = {...tempW}
			} else if (tempX.id == tempY.id && tempX.count+1 <= items.getStack(tempX.id)) { // The same itemtype
				var tempZ = {...tempX}
				var tempW = {...tempY}
				tempZ.count = tempZ.count + 1
				tempW.count = tempW.count - 1
				if (tempW.count <= 0) tempW = {}
				inv.main[x] = {...tempZ}
				this.tempslot = {...tempW}
			}
		}
		// Bin slot (ignored for now)
		else if (x == -1){
	
		}
	}
}

module.exports = { 
	Inventory: Inventory,
	PlayerInventory: PlayerInventory
}