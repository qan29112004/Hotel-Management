import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NewsService } from 'app/core/admin/news/news.service';
import { News } from 'app/core/admin/news/news.types';
import { FormsModule } from '@angular/forms';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { UserService } from 'app/core/profile/user/user.service';
import { uriConfig } from 'app/core/uri/config';

@Component({
    selector: 'auth-news-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        AngularEditorModule
    ],
    templateUrl: './news-detail.component.html',
    styleUrls: ['./news-detail.component.scss']
})
export class NewsDetailComponent implements OnInit {
    news: News | null = null;
    editorConfig: AngularEditorConfig = {
        editable: true,
        spellcheck: true,
        height: '15rem',
        minHeight: '5rem',
        translate: 'no',
        defaultParagraphSeparator: 'p',
        defaultFontName: 'Arial',
        fonts: [
            { class: 'arial', name: 'Arial' },
            { class: 'times-new-roman', name: 'Times New Roman' },
            { class: 'calibri', name: 'Calibri' },
            { class: 'comic-sans-ms', name: 'Comic Sans MS' }
        ],
        toolbarHiddenButtons: [
            ['insertImage', 'insertVideo']
        ],
        toolbarPosition: 'top',
        enableToolbar: true,
        showToolbar: true,
        sanitize: false,
        uploadUrl: uriConfig.API_UPLOAD_IMAGE,
        uploadWithCredentials: false,
        customClasses: [
            {
                name: 'insert-image',
                class: 'insert-image',
            },
        ],
    };
    currentUserId: number | null = null;
    isImageLoading = false;
    imageError = false;
    showImagePopup = false;
    imageUrl = '';
    insertFn: any;


    constructor(
        private _route: ActivatedRoute,
        private _newsService: NewsService,
        private _alertService: AlertService,
        private _router: Router,
        private _translocoService: TranslocoService,
        private _userService: UserService
    ) { }

    ngOnInit() {
        this._userService.itemUser$.subscribe(user => {
            this.currentUserId = user?.id || null;
        });

        this._route.params.subscribe(params => {
            const slugWithHtml = params['slug'];
            const slug = slugWithHtml.replace(/\.html$/, '');
            if (slug) {
                this.loadNewsDetail(slug);
            }
        });
    }

    loadNewsDetail(slug: string) {
        this._newsService.getNewsBySlug(slug).subscribe(
            (news) => {
                this.news = news;
            },
            (error) => {
                console.error('Error loading news:', error);
            }
        );
    }

    handleImageError(event: Event) {
        this.imageError = true;
        this.isImageLoading = false;
    }

    handleImageLoad(event: Event) {
        this.imageError = false;
        this.isImageLoading = false;
    }
}
