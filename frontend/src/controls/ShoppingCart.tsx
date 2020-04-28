import * as React from 'react';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import createStyles from '@material-ui/core/styles/createStyles';
import withStyles, { WithStyles } from '@material-ui/core/styles/withStyles';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import withRoot from '../withRoot';
import { Button, Grid, TextField, CardContent, Card, Paper, CardActions, Typography } from '@material-ui/core';
import MaterialTable from 'material-table';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import { User, CartItem, Item } from '../stores/index'

const styles = (theme: Theme) =>
  createStyles({
    root: {
      
    },   
    button: {
      margin: theme.spacing(1),
    },
    buttonBar: {
      textAlign: "right"
    },
    editorContainer:{
      paddingTop: "20px"
    },
    padding: {
        padding: theme.spacing(2),
        minWidth: 700,
        textAlign:"center",
    }
  });


interface Props {
  userId: string;
  onClose: () => void;  
  onDeleteCartItem: (c: CartItem) => void;
  onDeleteCart: (cs: CartItem[]) => void;
  open: boolean;
  store: any;  
};

type State = {
    name: string;  
    avatar: string;  
}



class ShoppingCart extends React.Component<Props & WithStyles<typeof styles>, State> {
  state = {name: "", avatar: "imgs/" + Math.round(Math.random()*23) + ".png" }    
  handleClose = () => {
    this.props.onClose();
  };  
  render() {  
    const  classes = this.props.classes;  
    let avtarImage = []
    let total = 0;
    for(var i=0; i<=23; i++)avtarImage.push("imgs/"+i+".png");
    return (
      <Dialog onClose={this.handleClose} aria-labelledby="simple-dialog-title" open={this.props.open} maxWidth="xl">
        <div className={classes.padding}>
        <DialogTitle id="te-dialog-title">Checkout</DialogTitle>
        <Card elevation={0}>
        <CardContent style={{ padding: 0 }}>

          <MaterialTable
            components={{
              Container: (props:any) => <Paper {...props} elevation={0} />
            }}
            isLoading={false}
            title="Shopping Cart"
            data={this.props.store.cartStore.cartitems.map( (ci: CartItem) =>{
              let item = this.props.store.itemStore.items[ci.item] as Item;
              total = total + (item.price * ci.quantity);
              return {
                id: item.id,
                user: this.props.userId,
                name: item.name,
                img: item.image,
                quantity: ci.quantity,
                price: item.price,
              }
            } )}
            actions={[
              {
                icon: () => <DeleteOutline/>,
                tooltip: 'Delete Item(s)',
                onClick: (e:any, rowData:any) => {
                  console.log("onDeleteCartItem", rowData);
                  this.props.onDeleteCartItem({
                    user: this.props.userId,
                    item: rowData.id,
                    quantity: rowData.quantity
                  } as CartItem);                  
                }
              },
              {
                icon: () => <DeleteOutline/>,
                tooltip: 'Delete All Item',
                onClick: () => {
                  this.props.onDeleteCart(this.props.store.cartStore.cartitems);                
                },
                isFreeAction: true
              }
            ]}
            columns={[
              { title: 'Product', field: 'name' },
              { title: 'Quantity', field: 'quantity', type: 'numeric' },
              { title: 'Price', field: 'price', type: 'currency' },
            ]}
            options={{
              actionsColumnIndex: -1,
              emptyRowsWhenPaging: false,
              paging: false,
              search: false
            }}
            localization={{
              body: {
                emptyDataSourceMessage: 'No item in your shopping cart'
              },
              header: {
                actions: ''
              }
            }}
          />

          <div style={{ padding: '10px 20px 10px 10px', textAlign: 'right' }}>

          </div>
        </CardContent>
        
        <CardActions style={{ justifyContent: "flex-end" }}>
          <Typography variant="h6" style={{ marginRight: 10 }}>
            Total: ${total}       
            </Typography>
          <Button
            variant="outlined"
            color="primary"
            style={{ textTransform: 'none' }}                        
          >
            Payment
          </Button>
        </CardActions>
      
      </Card>
        </div>      
      </Dialog>
    ); 
  }
}

export default withRoot(withStyles(styles)(ShoppingCart));