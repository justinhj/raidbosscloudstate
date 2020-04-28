import * as React from 'react';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import classnames from 'classnames';
import createStyles from '@material-ui/core/styles/createStyles';
import withStyles, { WithStyles } from '@material-ui/core/styles/withStyles';
import withRoot from '../withRoot';
import { MenuItem, ListItemIcon, Menu, Button, ListItem } from '@material-ui/core';
import { maxWidth } from '@material-ui/system';

const styles = (theme: Theme) =>
  createStyles({
    imgSelect: {
        maxWidth: 32,
        maxHeight: 32,
      },
     
  });

type State = {
  anchorEl: any
};

interface Props {
  selectedImg: string;
  images?: string[];
  onImageSelect: (string) => void;
};

class ImagePicker extends React.Component<Props & WithStyles<typeof styles>, State> {
    state = { anchorEl: undefined };

    handleClick = (event) =>{
      this.setState({anchorEl: event.currentTarget})
    }
    handleClose = () => {
      this.setState({anchorEl: undefined})
    }
    handleImageSelect = (src: string) => () =>{
      this.props.onImageSelect(src)
      this.setState({anchorEl: undefined})
    }

  render() {    
    const classes = this.props.classes 
    const selectedImg = this.props.selectedImg
    return (
      <div>
      <Button
        aria-controls="customized-menu"
        aria-haspopup="true"
        variant="contained"
        color="default"
        onClick={this.handleClick}
      >
        <img src={selectedImg} className={classes.imgSelect}  />
        Avatar
      </Button>
      <Menu
        elevation={0}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        id="customized-menu"
        anchorEl={this.state.anchorEl}
        keepMounted
        open={this.state.anchorEl != undefined}
        onClose={this.handleClose}
      >
      {this.props.images && this.props.images.filter && this.props.images.filter(x => x != selectedImg).map( x => (
        <MenuItem key={x} onClick={this.handleImageSelect(x)}>
            <img src={x} className={classes.imgSelect} />
        </MenuItem>    
      ))}
            
      </Menu>
    </div>
    );
  }
}

export default withRoot(withStyles(styles)(ImagePicker));
