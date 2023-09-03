import { Component, OnInit, inject } from '@angular/core';
import { UserService } from "src/app/service/user.service";
import { UserResponse } from 'src/app/model/UserResponse';
import { DecodeJwt } from 'src/app/model/DecodeJwtToken';
import { AuthenticationService } from 'src/app/service/authentication.service';
import jwt_decode from 'jwt-decode';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from 'src/app/service/post.service';
import { User } from 'src/app/model/User';

@Component({
  selector: 'app-post-page',
  templateUrl: './post-page.component.html',
  styleUrls: ['./post-page.component.css']
})
export class PostPageComponent implements OnInit {
  constructor(private userServ:UserService,private route: ActivatedRoute,private postService: PostService,private router:Router) {
  }
  jwtToken:any=inject(AuthenticationService).getToken();
  decodeJwt:DecodeJwt=jwt_decode(this.jwtToken);
  userDetails: UserResponse = new UserResponse;
  userName!:string;
  userEmail!:string;
  userImage!:string;
  idPost!: number;
  post:any;
  user!:User;
  isLoading=false;
  isHidden=true;
  isHidden2=true

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idPost = +params['id'];
    });
    console.log("ID POST",this.idPost);
    this.getUserDetails();
    
    
  }
  checkIsAdminOrIsYourPosts(idUserPost:string){
    return (this.decodeJwt.roles[0] =='ROLE_ADMIN' || this.userDetails.body.id == idUserPost);
  
  }
  checkIsAdminOrIsYourPostsOrIsYourComment(idUserPost:string,idUserComment:string){
    return (this.decodeJwt.roles[0] =='ROLE_ADMIN' || this.userDetails.body.id == idUserPost||this.userDetails.body.id==idUserComment);
  
  }

  getUserDetails(){
    this.userServ.getUserToken().subscribe(
      (userData) => {
        this.userDetails = userData ;
        this.userName=this.userDetails.body.userName;
        this.userEmail=this.userDetails.body.email;
        this.userImage=this.userDetails.body.profileImage
        this.PostById();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  PostById(){
    this.postService.postById(this.idPost).subscribe((response)=>{
      this.post=response.body;
      this.user=this.post.user;
      this.post['numberLikes']=this.post.like.length;
      this.post['numberComments']=this.post.comment.length;
      //like onLoad
      let userId=this.userDetails.body.id;
      let index =this.post.like.findIndex((like: { users: { id: string; }; }) => like.users.id == userId);
      if (index<0) {
        this.post['isLiked']=false
      }else{
        this.post['isLiked']=true
      }
      setTimeout(()=>{
        this.isLoading=true
      },200);
      
      console.log(this.post)
    });
  }

  ifTherIsMedia():boolean{
    return this.post.mediaList.length !== 0;
   }
   convertImage(media: string,type:string) {
     var url = 'data:'+type+';base64,' + media;
     return url;
   }
   isImage(i:string):boolean{
   
     return i.endsWith('jpg') || i.endsWith('jpeg') || i.endsWith('png');
    }
    isVideo(i:string):boolean{
     return i.endsWith('mp4') || i.endsWith('mov') || i.endsWith('avi');
    }
   pathGen(path:string){
     return"assets/media/"+path;
   }
   timeGenerator(date:number){
     const previousTime= new Date(date)
     const currentTime = new Date();
       const timeDifferenceInSeconds = Math.floor((currentTime.getTime() - previousTime.getTime()) / 1000);
       if (timeDifferenceInSeconds < 60) {
         return `${timeDifferenceInSeconds} seconds ago`;
       }if (timeDifferenceInSeconds < 3600) {
         const minutes = Math.floor(timeDifferenceInSeconds / 60);
         return `${minutes} minutes ago`;
       } if (timeDifferenceInSeconds < 86400) {
         const hours = Math.floor(timeDifferenceInSeconds / 3600);
         return  `${hours} hours ago`;
       } if (timeDifferenceInSeconds < 2592000) {
         const days = Math.floor(timeDifferenceInSeconds / 86400);
         return `${days} days ago`;
       }  
         const months = Math.floor(timeDifferenceInSeconds / 2592000);
         return `${months} months ago`;
   }
   likePost(idPost:number){
     const like=document.getElementById("like");
    
     this.postService.likePost(idPost,this.userDetails.body.id).subscribe(
         (response)=>{
           
           if (response.body) {
             like?.classList.remove("text-white");
             like?.classList.add("text-red-600");
             this.post['numberLikes']++;
             
             return;
           }
           like?.classList.remove("text-red-600");
           like?.classList.add("text-white");
           this.post['numberLikes']--;
           
           
         });
   }
   
dropDownMenue(){
  if (this.isHidden==true) {
    this.isHidden=false;
    return;
  }
  
  this.isHidden=true;
 
}
dropDownMenueConfirm(){
  if (this.isHidden2==true) {
    this.isHidden2=false;
    return;
  }
  this.isHidden2=true;

}


deletePost(id:number){
  this.postService.deletePost(id).subscribe((response)=>{
    console.log(response)
    this.router.navigate(["/index"]);

  });
}
contentOfComment:string='';
createComment(){
    if (this.contentOfComment=='') {
      return;
    }
  this.postService.createComment(this.post.id,this.userDetails.body.id,this.contentOfComment).subscribe((response)=>{
      console.log(response)
      this.contentOfComment='';
      this.PostById();
  })
}

navigateToPostPage(postId: number) {
  this.router.navigate(['/post', postId]);
}
navigateToProfilePage(email: string) {
  this.router.navigate(['/profile', email]);
}



}
