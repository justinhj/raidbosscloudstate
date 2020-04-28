import * as React from 'react';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import createStyles from '@material-ui/core/styles/createStyles';
import withStyles, { WithStyles } from '@material-ui/core/styles/withStyles';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import withRoot from '../withRoot';
import { Button, Grid, TextField } from '@material-ui/core';
import ImagePicker from './ImagePicker';
import { User } from '../stores/index'

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
        minWidth: 400,
        textAlign:"center",
    }
  });


interface Props {
  onClose: () => void;  
  onUserAdded: (User) => void;
  open: boolean;
  store: any;  
};

type State = {
    name: string;  
    avatar: string;  
}



class UserDialog extends React.Component<Props & WithStyles<typeof styles>, State> {
  state = {name: "", avatar: "imgs/" + Math.round(Math.random()*23) + ".png" }
    
  handleClose = () => {
    this.props.onClose();
  };
  onChange = (key) => (event) => {
    let x = {}
    x[key] = event.target.value;
    this.setState(x);
  }   
  handleAddUser = () => {
    this.setState({name: "", avatar: "imgs/" + Math.round(Math.random()*23) + ".png" });
    this.props.onUserAdded({name: this.state.name, avatar: this.state.avatar, online: true} as User);
  }
  handleAvatarSelect = (avatar) => {
    this.setState({avatar});
  }
 
  render() {  
    const  classes = this.props.classes;  
    let avtarImage = []
    for(var i=0; i<=23; i++)avtarImage.push("imgs/"+i+".png");
    return (
      <Dialog onClose={this.handleClose} aria-labelledby="simple-dialog-title" open={this.props.open} maxWidth="lg">
        <div className={classes.padding}>
        <DialogTitle id="te-dialog-title">Who are you?</DialogTitle>
        <Grid item xs={12} className={classes.padding}>
            <ImagePicker onImageSelect={this.handleAvatarSelect} selectedImg={this.state.avatar} images={avtarImage} />
        </Grid>
        <Grid item xs={12} className={classes.padding}>
          <TextField type="email" onChange={this.onChange("name")} value={this.state.name} required id="name" label="Name of User" fullWidth />
        </Grid>                           
        <Grid item xs={12} md={12}>       
          {/* 
          <Button
            variant="contained"
            color="default"
            onClick={this.handleClose}
            className={classes.button}>
            Cancel
          </Button> */}
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleAddUser}
            disabled={
                !(this.state.name != "")
            }
            className={classes.button}>
            Login
          </Button>
        </Grid>
        </div>      
      </Dialog>
    ); 
  }
}

export default withRoot(withStyles(styles)(UserDialog));