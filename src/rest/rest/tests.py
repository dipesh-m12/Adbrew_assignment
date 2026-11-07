from unittest.mock import patch

from django.test import SimpleTestCase
from pymongo.errors import ServerSelectionTimeoutError
from rest_framework.test import APIRequestFactory

from .views import TodoListView


class TodoListViewTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = TodoListView.as_view()

    @patch('rest.views.db')
    def test_get_returns_todos(self, db):
        db.todos.find.return_value.sort.return_value = [
            {'_id': 'abc', 'description': 'Learn Docker'},
        ]

        response = self.view(self.factory.get('/todos/'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {'todos': [{'id': 'abc', 'description': 'Learn Docker'}]},
        )

    @patch('rest.views.db')
    def test_post_saves_trimmed_description(self, db):
        db.todos.insert_one.return_value.inserted_id = 'new-id'

        response = self.view(
            self.factory.post('/todos/', {'description': '  Learn React  '}, format='json')
        )

        self.assertEqual(response.status_code, 201)
        db.todos.insert_one.assert_called_once_with({'description': 'Learn React'})
        self.assertEqual(response.data['todo']['description'], 'Learn React')

    @patch('rest.views.db')
    def test_post_rejects_blank_description(self, db):
        response = self.view(
            self.factory.post('/todos/', {'description': '   '}, format='json')
        )

        self.assertEqual(response.status_code, 400)
        db.todos.insert_one.assert_not_called()

    @patch('rest.views.db')
    def test_post_rejects_oversized_description(self, db):
        response = self.view(
            self.factory.post('/todos', {'description': 'x' * 501}, format='json')
        )

        self.assertEqual(response.status_code, 400)
        db.todos.insert_one.assert_not_called()

    @patch('rest.views.logger')
    @patch('rest.views.db')
    def test_get_reports_mongo_failure(self, db, logger):
        db.todos.find.side_effect = ServerSelectionTimeoutError('Mongo unavailable')

        response = self.view(self.factory.get('/todos'))

        self.assertEqual(response.status_code, 503)
        self.assertIn('error', response.data)
        logger.exception.assert_called_once()

    @patch('rest.views.logger')
    @patch('rest.views.db')
    def test_post_reports_mongo_failure(self, db, logger):
        db.todos.insert_one.side_effect = ServerSelectionTimeoutError('Mongo unavailable')

        response = self.view(
            self.factory.post('/todos', {'description': 'Learn Mongo'}, format='json')
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn('error', response.data)
        logger.exception.assert_called_once()
