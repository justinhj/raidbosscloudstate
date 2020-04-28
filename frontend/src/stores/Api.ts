
import { User, CartItem, Item } from '../stores';
import { BrowserHeaders } from 'browser-headers';
import { ShoppingCartClient, ServiceError } from '../_proto/shoppingcart_pb_service';
import { AddLineItem, RemoveLineItem, GetShoppingCart, Cart } from '../_proto/shoppingcart_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';


export class Api{
    store: any = null;
    host = window.location.protocol + "//"+window.location.hostname + (window.location.hostname == "localhost" ? ":" + window.location.port : "");
    client = new ShoppingCartClient(this.host);

    setStore = (store) => {
        this.store = store;
    }

    addItem = (user: User, item: Item, quantity: number) => {        
        const addItem = new AddLineItem();
        addItem.setName(item.name);
        addItem.setProductId(item.id);
        addItem.setQuantity(quantity);
        addItem.setUserId(user.name);
        const metadata = new BrowserHeaders({'x-custom-header-1': 'example'});
        
        return new Promise<void>( (resolve, reject) => {
            this.client.addItem(addItem, metadata,(err: ServiceError, response: Empty) => {
                console.log("err", err);
                if(err)reject(err);
                else resolve();                
            });
        });        
    }

    removeItem = (user: User, item: Item, quantity: number) => {        
        const remItem = new RemoveLineItem();
        remItem.setProductId(item.id);
        remItem.setUserId(user.name);
        const metadata = new BrowserHeaders({'x-custom-header-1': 'example'});        
        return new Promise<void>( (resolve, reject) => {
            this.client.removeItem(remItem, metadata,(err: ServiceError, response: Empty) => {
                console.log("err", err);
                if(err)reject(err);
                else resolve();                
            });
        });        
    }

    getCart = (user: User)  => {
        const get = new GetShoppingCart();
        const metadata = new BrowserHeaders({'x-custom-header-1': 'example'}); 
        get.setUserId(user.name);
        return new Promise<CartItem[]>( (resolve, reject) => {
            this.client.getCart(get, metadata,(err: ServiceError, response: Cart) => {
                if(err)reject(err);
                else{
                    const items = response.getItemsList().map( x => ({user: user.name, item: x.getProductId(), quantity: x.getQuantity() } as CartItem) );
                    console.log("got items", items);
                    resolve(items); 
                }                            
            });
        }); 
    }
}


export default Api;