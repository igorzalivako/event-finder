import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Mail, Globe, Star, Users, Calendar, AlertTriangle } from "lucide-react";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { mockOrganizers, mockEvents, mockReviews } from "../data/mock-data";
import { EventCard } from "../components/event-card";
import { ReviewItem } from "../components/review-item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {useAuth} from "../context/AuthContext";

export function OrganizerPage() {
  const { id } = useParams();
  const organizer = mockOrganizers.find((o) => o.id === id);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [rating, setRating] = useState(0);
  const {userName} = useAuth();

  if (!organizer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={true} userName={userName} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2>Организатор не найден</h2>
            <Button asChild className="mt-4">
              <Link to="/">На главную</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const organizerEvents = mockEvents.filter((e) => e.organizerId === organizer.id);

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:fill-yellow-300 hover:text-yellow-300' : ''}`}
        onClick={() => interactive && onRate && onRate(i + 1)}
      />
    ));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} userName={userName} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Organizer Header */}
          <div className="border-b pb-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={organizer.avatar} alt={organizer.name} />
                <AvatarFallback>{organizer.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="mb-2">{organizer.name}</h1>
                <p className="text-muted-foreground mb-4">{organizer.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${organizer.email}`} className="hover:text-foreground">
                      {organizer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <a href={`https://${organizer.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                      {organizer.website}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {renderStars(organizer.rating)}
                  <span className="text-sm text-muted-foreground ml-2">
                    {organizer.rating} ({organizer.reviewCount} отзывов)
                  </span>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span><strong>{organizer.followers}</strong> подписчиков</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span><strong>{organizer.eventsCount}</strong> мероприятий</span>
                  </div>
                  <div className="text-muted-foreground">
                    На платформе с {formatDate(organizer.joinDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {/* Rate Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Оценить
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Оценить организатора</DialogTitle>
                    <DialogDescription>
                      Поставьте оценку от 1 до 5 звезд
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {renderStars(rating, true, setRating)}
                    </div>
                    {rating > 0 && (
                      <p className="text-center text-sm text-muted-foreground">
                        Вы выбрали: {rating} {rating === 1 ? 'звезда' : rating < 5 ? 'звезды' : 'звезд'}
                      </p>
                    )}
                    <Button
                      className="w-full"
                      style={{ backgroundColor: 'var(--primary-color)' }}
                      disabled={rating === 0}
                    >
                      Отправить оценку
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Subscribe Button */}
              <Button
                onClick={() => setIsSubscribed(!isSubscribed)}
                style={{
                  backgroundColor: isSubscribed ? '' : 'var(--primary-color)',
                }}
                variant={isSubscribed ? 'outline' : 'default'}
              >
                {isSubscribed ? 'Отписаться' : 'Подписаться'}
              </Button>

              {/* Report Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Пожаловаться
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Пожаловаться на организатора</DialogTitle>
                    <DialogDescription>
                      Опишите причину вашей жалобы
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="reason">Причина</Label>
                      <Select>
                        <SelectTrigger id="reason">
                          <SelectValue placeholder="Выберите причину" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spam">Спам</SelectItem>
                          <SelectItem value="fraud">Мошенничество</SelectItem>
                          <SelectItem value="inappropriate">Неприемлемый контент</SelectItem>
                          <SelectItem value="other">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="comment">Комментарий</Label>
                      <Textarea
                        id="comment"
                        placeholder="Опишите подробнее..."
                        rows={4}
                      />
                    </div>
                    <Button className="w-full" variant="destructive">
                      Отправить жалобу
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="events">Мероприятия</TabsTrigger>
              <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              <TabsTrigger value="info">Информация</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizerEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {organizerEvents.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Нет мероприятий
                </p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-4 max-w-3xl">
                {mockReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <div className="max-w-3xl space-y-6">
                <div>
                  <h3 className="mb-2">О нас</h3>
                  <p className="text-muted-foreground">{organizer.description}</p>
                </div>
                <div>
                  <h3 className="mb-2">Контактная информация</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Email: {organizer.email}</p>
                    <p>Сайт: {organizer.website}</p>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2">Статистика</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Проведено мероприятий: {organizer.eventsCount}</p>
                    <p>Подписчиков: {organizer.followers}</p>
                    <p>Средний рейтинг: {organizer.rating} / 5</p>
                    <p>Количество отзывов: {organizer.reviewCount}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}