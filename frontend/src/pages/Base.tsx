import * as React from 'react';
import clsx from 'clsx';
import { Route } from 'react-router';
import classNames from 'classnames';
import {observer, inject} from 'mobx-react';
import { MuiThemeProvider, createMuiTheme, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import createStyles from '@material-ui/core/styles/createStyles';
import withRoot from '../withRoot';
import { IconButton, Typography, CssBaseline, AppBar, Toolbar, GridList, GridListTile, Card, CardActionArea, CardMedia, CardContent, CardActions, Button, Badge} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import AddIcon from '@material-ui/icons/Add';
import SubIcon from '@material-ui/icons/Remove';

import UserDialog from '../controls/UserDialog';
import { User, Item, CartItem } from '../stores';
import { Cart } from '../_proto/shoppingcart_pb';
import ShoppingCart from '../controls/ShoppingCart';



const inventory: Item[] = [
  {
    id: "sg-1",
    name: "Sonar Sunglass",
    description: "something",
    image: "imgs/shades1.jpg",    
    price: 600.00,
  } as Item,
  {
    id: "sg-2",
    name: "Shield Sunglass",
    description: "something",
    image: "imgs/shades2.jpg",
    price: 450.00,
  } as Item,
  {
    id: "sg-3",
    name: "Warp Sunglass",
    description: "something",
    image: "imgs/shades3.jpg",
    price: 999.00,
  } as Item,
  {
    id: "sg-4",
    name: "Pilot Sunglass",
    description: "something",
    image: "imgs/shades4.jpg",
    price: 1250.00,
  } as Item,
  {
    id: "sg-5",
    name: "Volcano Sunglass",
    description: "something",
    image: "imgs/shades5.jpg",
    price: 499.00,
  } as Item,
  {
    id: "sg-6",
    name: "Time Machine Sunglass",
    description: "something",
    image: "imgs/shades6.jpg",
    price: 855.00,
  } as Item,
  {
    id: "sg-7",
    name: "Eternal Now Sunglass",
    description: "something",
    image: "imgs/shades7.jpg",
    price: 999.00,
  } as Item,
  {
    id: "sg-8",
    name: "Flow Sunglass",
    description: "something",
    image: "imgs/shades8.jpg",
    price: 1260.00,
  } as Item,
  {
    id: "sg-9",
    name: "Candy Sunglass",
    description: "something",
    image: "imgs/shades9.jpg",
    price: 1225.00,
  } as Item,
];


const styles = (theme: Theme) =>
createStyles({
    root: {
        display: 'flex',       
      },
      card: {
        maxWidth: 400,
        margin: theme.spacing(2),
      },
      tile: {
        flexGrow: 1,
      },     
      title: {
        flexGrow: 1,
      }, 
      flex: {
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
      },      
      appBar: {
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: "black",
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      },
      appBarShift: {        
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
      menuButton: {
        marginRight: 36,
      },
      hide: {
        display: 'none',
      },      
      listPadding:{
        paddingLeft: 5,
      },     
      toolbar: {          
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
      },
      content: {
        flexGrow: 1,
        padding: theme.spacing(3),
      },    
});

type State = {
  open: boolean;
  userDialogOpen: boolean;
  user: User;
  quants: any;
  shoppingCartOpen: boolean;
};

type Props = {
  store: any
}

@inject('routing')
@observer
class Base extends React.Component<Props & WithStyles<typeof styles>, State> {
  state = {
    open: true,
    userDialogOpen: true,
    user: undefined,
    quants: {},
    shoppingCartOpen: false,
  };
  
  constructor(props){
    super(props);
    inventory.map(x => props.store.itemStore.addItem(x) );   
  }

  handleAddToCart = (item: Item) => () => {
    const quant = this.state.quants[item.id] || 1 
    this.props.store.api.addItem(this.state.user, item, quant).then( () =>{
      // things went well so add item to cart
      this.props.store.cartStore.addCartItem({
        user: this.state.user.name,
        item: item.id,
        quantity: quant,
      } as CartItem);
    }).catch( (err) => {
      console.error(err);
    });
  }

  handelOnUserAddOpen = () =>{    
    this.setState({ userDialogOpen: true });
  }
  handelAddUserClose = () =>{
    this.setState({ userDialogOpen: false });
  }
  handelOnUserAdd = (user: User) => {   
    this.setState({user});    
    this.handelAddUserClose();
    this.props.store.api.getCart(user).then( (items: CartItem[]) => {
      items.map(i => this.props.store.cartStore.addCartItem(i));
    }).catch( err => {
      console.error(err);
    })
  }
  onDeleteCartItem = (ci: CartItem) => {
    this.props.store.api.removeItem(this.state.user, this.props.store.itemStore.items[ci.item]).then( () =>{
      this.props.store.cartStore.removeCartItem(ci);
    }).catch( (err) => {
      console.error(err);
    });
  }

  onDeleteCart = (cis: CartItem[]) => {
    cis.map( x => this.onDeleteCartItem(x));
  }

  adjustQuantity = (item: Item, delta: number) => () => {
    let current = this.state.quants[item.id] ? this.state.quants[item.id] : 1;
    current = current + delta;
    if(current < 1)current = 1;
    let update = {};
    update[item.id] = current;
    this.setState({quants: {...this.state.quants, ...update}});
  }

  handelOnUserOnline = (user: User) => () =>{
    this.handelOnUserAdd({...user, online: true});
  }
  handleShoppingCartVisible = (shoppingCartOpen: boolean) => () => {
    this.setState({shoppingCartOpen});
  }

  render() {    
    const classes = this.props.classes;    
    let ind = 0;    
    return (    
        <div className={classes.root}>
        <CssBaseline />
        <AppBar
          position="fixed"
          className={clsx(classes.appBar, {
            [classes.appBarShift]: this.state.open,
          })}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={ () => {} }
              edge="start"
              className={clsx(classes.menuButton, {
                [classes.hide]: this.state.open,
              })}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title} noWrap>
              Bend Light Eyewear
            </Typography>
            <Badge badgeContent={this.props.store.cartStore.cartitems.length} style={ {top: 10} } color="secondary">
            <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={this.handleShoppingCartVisible(true)}
                color="inherit"
              >
                <ShoppingCartIcon />
              </IconButton>
              </Badge>
          </Toolbar>
        </AppBar>     
        <main className={classes.content}>
          <div className={classes.toolbar} />
        
          <div className={classes.flex}>
            {this.props.store.itemStore.stream.map( (i: Item) => (
              <div key={i.id} className={classes.tile}>                
                <Card className={classes.card}>
                  <CardActionArea onClick={this.handleAddToCart(i)}>
                    <CardMedia
                      component="img"
                      alt={i.name}
                      height="140"
                      image={i.image}
                      title={i.name}
                    />
                    <CardContent>
                    <Typography variant="h6" color="textSecondary" style={ {float: "right"} } component="p">
                        {"$" + i.price}
                      </Typography>
                      <Typography gutterBottom variant="h5" component="h2">
                        {i.name}                      
                      </Typography>                      
                      <Typography variant="body2" color="textSecondary" component="p">
                        Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
                        across all continents except Antarctica
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <CardActions>
                    <IconButton onClick={this.adjustQuantity(i, -1)} >
                      <SubIcon />
                    </IconButton>
                    <Button size="small" color="primary">
                      {this.state.quants[i.id] ? this.state.quants[i.id] : "1"}
                    </Button>
                    <IconButton onClick={this.adjustQuantity(i, +1)}>
                      <AddIcon />
                    </IconButton>
                    <Button size="small" color="primary" onClick={this.handleAddToCart(i)} >
                      Add to Cart
                    </Button>
                  </CardActions>
                </Card>
            </div>            
            ))}           
        </div>
        </main>
        <ShoppingCart store={this.props.store} open={this.state.shoppingCartOpen} userId={this.state.user && this.state.user.name} onClose={this.handleShoppingCartVisible(false)} onDeleteCartItem={this.onDeleteCartItem} onDeleteCart={this.onDeleteCart} />
        <UserDialog store={this.props.store} onClose={this.handelAddUserClose} onUserAdded={this.handelOnUserAdd} open={this.state.userDialogOpen} />
      </div>      
    );
  }
}


export default withRoot((withStyles(styles)(Base) ));
