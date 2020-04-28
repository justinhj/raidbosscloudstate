import { RouterStore } from 'mobx-react-router';
import { observable, computed, toJS } from 'mobx';
import { Api } from './Api'

const routingStore = new RouterStore();
//const apiController = new ApiController();


export interface User{
    name: string;
    avatar: string;
    online: boolean;
}

export interface Item{
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
}

export interface CartItem{
    user: string;
    item: string;
    quantity: number;
}

class UserStore{
    @observable users: { [id:string]:User } = {};    
    @computed get stream(){
        return Object.keys(this.users).map(x => this.users[x]).sort( (a, b) => a.name.localeCompare(b.name) )
    }
    addUser(u: User) {
        this.users[u.name] = u
    }
    addUserList(list: User[]){
        list.map( x => this.addUser(x));
    }   
    removeUser(u: User){
        delete this.users[u.name];
    }
}

class ItemStore{
    @observable items: { [id:string]:Item } = {};    
    @computed get stream(){
        return Object.keys(this.items).map(x => this.items[x])
    }          
    addItem(i: Item) {
        this.items[i.id] = i;      
    }   
}

class CartStore{
    @observable cartitems: CartItem[] = [];     
    addCartItem(i: CartItem) {
        this.cartitems = [...this.cartitems, i];              
    }  
    removeCartItem(i: CartItem) {
        this.cartitems = this.cartitems.filter( x => !(x.user == i.user && x.item == i.item) );            
    }  
}


const userStore = new UserStore();
const itemStore = new ItemStore();
const cartStore = new CartStore();
const api = new Api();


const stores = {
    routing: routingStore, 
    userStore,
    itemStore,
    cartStore,
    api,
} 

api.setStore(stores);

export default stores;