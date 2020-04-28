import * as React from 'react';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import createStyles from '@material-ui/core/styles/createStyles';
import withStyles, { WithStyles } from '@material-ui/core/styles/withStyles';
import withRoot from '../withRoot';
import { Avatar, Badge } from '@material-ui/core';
import { User } from '../stores/index'

const styles = (theme: Theme) =>
  createStyles({
    root: {
      
    },       
    shapeCircle: {
      borderRadius: '50%',
      backgroundColor: theme.palette.primary.main,
      width: 16,
      height: 16,
    },
  });

interface Props {
  store: any;
  user: User;
};

class UserAvatar extends React.Component<Props & WithStyles<typeof styles>, undefined> {
  
  render() {  
    const  classes = this.props.classes;  
    return (
      <Badge        
        overlap="circle"
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        badgeContent={<div style={ {backgroundColor: (this.props.user.online ? "#30a030" : "red") } }  className={classes.shapeCircle} />}
      >
        <Avatar src={this.props.user.avatar} />
      </Badge>       
    ); 
  }
}

export default withRoot(withStyles(styles)(UserAvatar));