import { Routes } from '@angular/router';
import { MarketplaceComponent } from './marketplace.component';
import { MarketplaceCreateComponent } from './marketplace-create/marketplace-create.component';
import { MarketplaceDetailComponent } from './marketplace-detail/marketplace-detail.component';

const routes: Routes = [
  {
    path: '',
    component: MarketplaceComponent,
    children:[
      {path:"create-marketplace", component: MarketplaceCreateComponent},
      {path:":slug", component:MarketplaceDetailComponent}
    ]
  }
];

export default routes;
