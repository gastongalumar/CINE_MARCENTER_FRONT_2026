import { TestBed } from '@angular/core/testing';
import { DEFAULT_POSTER, ImageService } from './image';
import { environment } from '../../environments/environment';

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ImageService] });
    service = TestBed.inject(ImageService);
  });

  it('sin ruta → default poster', () => {
    expect(service.getImageUrl()).toBe(DEFAULT_POSTER);
    expect(service.getImageUrl('', 'fallback.svg')).toBe('fallback.svg');
  });

  it('http(s) absoluto se conserva', () => {
    expect(service.getImageUrl('https://cdn.example/p.jpg')).toBe('https://cdn.example/p.jpg');
    expect(service.getImageUrl('http://cdn.example/p.jpg')).toBe('http://cdn.example/p.jpg');
  });

  it('data: URI se conserva', () => {
    expect(service.getImageUrl('data:image/png;base64,aaa')).toBe('data:image/png;base64,aaa');
  });

  it('ruta /uploads se prefixea con baseUrl', () => {
    expect(service.getImageUrl('/uploads/a.jpg')).toBe(`${environment.baseUrl}/uploads/a.jpg`);
    expect(service.getImageUrl('uploads/a.jpg')).toBe(`${environment.baseUrl}/uploads/a.jpg`);
  });

  it('ruta desconocida → default', () => {
    expect(service.getImageUrl('assets/x.png')).toBe(DEFAULT_POSTER);
  });
});
